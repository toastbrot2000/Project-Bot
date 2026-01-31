import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    reconnectEdge,
    MiniMap,
    Panel,
    ReactFlowProvider,
    useReactFlow,
    BezierEdge,
    MarkerType,
    getNodesBounds
} from 'reactflow';
import { toSvg } from 'html-to-image';
import 'reactflow/dist/style.css';
import { QuestionNode, OptionNode, DocumentNode, EndNode } from './CustomNodes';
import CustomCurvedEdge from './CustomCurvedEdge';
import { parseXMLToFlow } from '../utils/xmlToFlow';
import { savePositions, clearPositions } from '../utils/positionManager';
import { flowToXML, downloadXML } from '../utils/flowToXML';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useHelperLines } from '../hooks/useFlowHelperLines';
import { getUpdatedEdges } from '../utils/selectionUtils';
import { useToast, Button } from '@project-bot/ui';
import {
    FilePlus,
    FolderOpen,
    Save,
    SaveAll,
    Download,
    Undo2,
    Redo2,
    Play,
    Pause,
    Trash2,
    MessageSquare,
    List,
    FileText,
    StopCircle,
    Keyboard
} from 'lucide-react';

const nodeTypes = {
    questionNode: QuestionNode,
    optionNode: OptionNode,
    documentNode: DocumentNode,
    endNode: EndNode
};

const StartOverlay = ({ onCreate, onLoad }) => (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex flex-col justify-center items-center z-50 text-gray-800">
        <div className="bg-white/80 backdrop-blur-md p-10 rounded-2xl shadow-xl border border-white/50 text-center max-w-md w-full">
            <div className="mb-6 flex justify-center">
                <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                    <MessageSquare size={48} />
                </div>
            </div>
            <h2 className="mb-3 text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Project Bot Admin</h2>
            <p className="text-gray-500 mb-8">Create or edit your conversation flows visually.</p>

            <div className="flex flex-col gap-3">
                <Button
                    onClick={onCreate}
                    size="lg"
                    className="w-full justify-center gap-2 h-12 text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                >
                    <FilePlus size={20} />
                    Create New File
                </Button>
                <Button
                    onClick={onLoad}
                    variant="outline"
                    size="lg"
                    className="w-full justify-center gap-2 h-12 text-base bg-white/50 border-gray-200 hover:bg-gray-50/80 transition-all hover:-translate-y-0.5"
                >
                    <FolderOpen size={20} />
                    Load Existing File
                </Button>
            </div>
        </div>
    </div>
);

const getDistanceToSegment = (p, v, w) => {
    const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    if (l2 === 0) return Math.sqrt(Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2));
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    return Math.sqrt(Math.pow(p.x - projection.x, 2) + Math.pow(p.y - projection.y, 2));
};

const FlowModelerContent = () => {
    const { addToast } = useToast();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    // const [edgeVisibility, setEdgeVisibility] = useState({ qToO: true, oToQ: true, doc: true }); // Unused
    const [globalAnimate, setGlobalAnimate] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [selectedWaypoint, setSelectedWaypoint] = useState(null); // { edgeId, index }
    const [manuallyMovedNodes, setManuallyMovedNodes] = useState(new Set());
    const { onNodeDrag: onNodeDragHelper, resetHelperLines, HelperLines } = useHelperLines();
    const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();
    const { takeSnapshot, undo, redo, canUndo, canRedo, clearHistory } = useUndoRedo();
    const dragStartSnapshot = useRef(null);
    const fileInputRef = useRef(null);
    const [fileHandle, setFileHandle] = useState(null);
    const [isProjectLoaded, setIsProjectLoaded] = useState(false);
    const [flowKey, setFlowKey] = useState(0); // Key to force remount of ReactFlow
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [_selectionStart, setSelectionStart] = useState(null);


    const edgeTypes = useMemo(() => ({
        'q-to-o': BezierEdge,
        'o-to-q': BezierEdge,
        'o-to-d': BezierEdge,
        'default': BezierEdge,
        'curved': CustomCurvedEdge
    }), []);

    const onWaypointDragStart = useCallback(() => {
        dragStartSnapshot.current = { nodes: getNodes(), edges: getEdges() };
    }, [getNodes, getEdges]);

    const onWaypointDragStop = useCallback(() => {
        if (dragStartSnapshot.current) {
            const { nodes: oldNodes, edges: oldEdges } = dragStartSnapshot.current;
            // Check if edges changed (waypoints only)
            // We map to a simplified structure to ignore 'selected', 'selectedWaypointIndex', etc.
            const getEdgeState = (eds) => eds.map(e => ({
                id: e.id,
                waypoints: e.data?.waypoints,
                waypoint: e.data?.waypoint // legacy
            }));

            const currentEdges = getEdges();
            const edgesChanged = JSON.stringify(getEdgeState(currentEdges)) !== JSON.stringify(getEdgeState(oldEdges));
            if (edgesChanged) {
                takeSnapshot(oldNodes, oldEdges);
            }
            dragStartSnapshot.current = null;
        }
    }, [getEdges, takeSnapshot]);

    const onWaypointClick = useCallback((edgeId, index) => {
        setSelectedWaypoint({ edgeId, index });
        setSelectedNode(null);
        setSelectedEdge(null);

        // Update edge data to include selected waypoint index
        setEdges((eds) => eds.map(e => {
            if (e.id === edgeId) {
                return {
                    ...e,
                    data: {
                        ...e.data,
                        selectedWaypointIndex: index
                    }
                };
            } else if (e.data?.selectedWaypointIndex !== undefined) {
                // Clear selection from other edges
                const { selectedWaypointIndex: _swi, ...restData } = e.data;
                return { ...e, data: restData };
            }
            return e;
        }));
    }, [setEdges]);

    const onWaypointDrag = useCallback((edgeId, index, screenPos) => {
        const flowPos = screenToFlowPosition(screenPos);
        setEdges((eds) => eds.map(e => {
            if (e.id === edgeId) {
                const waypoints = [...(e.data.waypoints || [e.data.waypoint])];
                waypoints[index] = { x: flowPos.x, y: flowPos.y };
                return {
                    ...e,
                    data: {
                        ...e.data,
                        waypoints
                    }
                };
            }
            return e;
        }));
    }, [screenToFlowPosition, setEdges]);

    // Removed auto-load of questions.xml

    const getEdgeParams = useCallback((sourceNode, targetNode) => {
        let type = 'default';
        let animated = false;
        let markerEnd = { type: MarkerType.ArrowClosed };
        let style = { strokeWidth: 2 };

        // Q→O edges: Thin, solid, gray (muted-foreground)
        if (sourceNode?.type === 'questionNode' && targetNode?.type === 'optionNode') {
            type = 'q-to-o';
            style = { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 };
        }
        // O→Q edges: Bold, dashed, dark gray (foreground)
        else if (sourceNode?.type === 'optionNode' && targetNode?.type === 'questionNode') {
            type = 'o-to-q';
            style = { stroke: 'hsl(var(--foreground))', strokeWidth: 2, strokeDasharray: '5,5' };
        }
        // O→D edges: Bold, dashed, blue (primary)
        else if (sourceNode?.type === 'optionNode' && targetNode?.type === 'documentNode') {
            type = 'o-to-d';
            style = { stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5,5' };
        }
        // Any→End edges: Solid, red (destructive)
        else if (targetNode?.type === 'endNode') {
            type = 'default';
            style = { stroke: 'hsl(var(--destructive))', strokeWidth: 2 };
        }

        return { type, animated, markerEnd, style };
    }, []);

    const onConnect = useCallback((params) => {
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        takeSnapshot(currentNodes, currentEdges);
        const { source, target } = params;

        // Prevent self-loops
        if (source === target) return;

        // Check for existing connection
        const exists = currentEdges.some(e =>
            (e.source === source && e.target === target) ||
            (e.source === target && e.target === source)
        );
        if (exists) return;

        // Determine edge type and style based on nodes
        const sourceNode = currentNodes.find(n => n.id === source);
        const targetNode = currentNodes.find(n => n.id === target);

        const { type, markerEnd, style } = getEdgeParams(sourceNode, targetNode);

        const newEdge = {
            ...params,
            id: `e${source}-${target}`,
            type,
            animated: globalAnimate,
            markerEnd,
            style,
            data: { onWaypointDrag, onWaypointClick, onWaypointDragStart, onWaypointDragStop }
        };

        setEdges((eds) => addEdge(newEdge, eds));
    }, [getNodes, getEdges, globalAnimate, setEdges, onWaypointDrag, getEdgeParams, takeSnapshot, onWaypointClick, onWaypointDragStart, onWaypointDragStop]);

    const onReconnect = useCallback((oldEdge, newConnection) => {
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        takeSnapshot(currentNodes, currentEdges);
        const { source, target } = newConnection;

        // Prevent self-loops
        if (source === target) return;

        // Check for existing connection (excluding the one we are reconnecting)
        const exists = currentEdges.some(e =>
            e.id !== oldEdge.id &&
            ((e.source === source && e.target === target) ||
                (e.source === target && e.target === source))
        );
        if (exists) return;

        const oldSourceNode = currentNodes.find(n => n.id === oldEdge.source);
        const oldTargetNode = currentNodes.find(n => n.id === oldEdge.target);
        const newSourceNode = currentNodes.find(n => n.id === source);
        const newTargetNode = currentNodes.find(n => n.id === target);

        // Enforce strict node type consistency
        // If source changed, new source must be same type as old source
        if (oldEdge.source !== source && oldSourceNode?.type !== newSourceNode?.type) {
            return;
        }
        // If target changed, new target must be same type as old target
        if (oldEdge.target !== target && oldTargetNode?.type !== newTargetNode?.type) {
            return;
        }

        const { type, markerEnd, style } = getEdgeParams(newSourceNode, newTargetNode);

        setEdges((els) => {
            const newEdges = reconnectEdge(oldEdge, newConnection, els);
            return newEdges.map(e => {
                if (e.id === oldEdge.id) {
                    return {
                        ...e,
                        type,
                        animated: globalAnimate,
                        markerEnd,
                        style,
                        data: { ...e.data, onWaypointDrag, onWaypointClick, onWaypointDragStart, onWaypointDragStop }
                    };
                }
                return e;
            });
        });
    }, [getNodes, getEdges, setEdges, getEdgeParams, onWaypointDrag, onWaypointClick, globalAnimate, takeSnapshot, onWaypointDragStart, onWaypointDragStop]);

    const onNodeDragStart = useCallback(() => {
        dragStartSnapshot.current = { nodes: getNodes(), edges: getEdges() };
    }, [getNodes, getEdges]);

    const onNodeDragStop = useCallback(() => {
        resetHelperLines();
        if (dragStartSnapshot.current) {
            const { nodes: oldNodes, edges: oldEdges } = dragStartSnapshot.current;
            // Check if nodes changed (position only)
            // We map to a simplified structure to ignore 'selected', 'dragging', etc.
            const getNodeState = (nds) => nds.map(n => ({
                id: n.id,
                x: n.position.x,
                y: n.position.y
            }));

            const currentNodes = getNodes();
            const nodesChanged = JSON.stringify(getNodeState(currentNodes)) !== JSON.stringify(getNodeState(oldNodes));
            if (nodesChanged) {
                takeSnapshot(oldNodes, oldEdges);
            }
            dragStartSnapshot.current = null;
        }
    }, [getNodes, takeSnapshot, resetHelperLines]);

    const onNodeDrag = useCallback((event, node) => {
        onNodeDragHelper(event, node, getNodes(), setNodes);
        setManuallyMovedNodes((prev) => new Set(prev).add(node.id));
    }, [getNodes, setNodes, onNodeDragHelper]);

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onNodeUpdate = useCallback((nodeId, newData) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === nodeId) {
                return { ...node, data: { ...node.data, ...newData } };
            }
            return node;
        }));
    }, [setNodes]);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: `${type}-${Date.now()}`,
                type,
                position,
                data: {
                    label: `New ${type}`,
                    onUpdate: onNodeUpdate
                },
            };

            takeSnapshot(getNodes(), getEdges());
            setNodes((nds) => nds.concat(newNode));
            setManuallyMovedNodes((prev) => new Set(prev).add(newNode.id));
        },
        [screenToFlowPosition, setNodes, getNodes, getEdges, takeSnapshot, onNodeUpdate]
    );

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
        setSelectedEdge(null);
        setSelectedWaypoint(null);
        // Clear waypoint selection from edges
        setEdges((eds) => eds.map(e => {
            let newData = e.data;
            if (e.data?.selectedWaypointIndex !== undefined) {
                const { selectedWaypointIndex: _swi, ...restData } = e.data;
                newData = restData;
            }
            return { ...e, data: newData, selected: false, animated: globalAnimate };
        }));
    }, [setEdges, globalAnimate]);



    const onEdgeClick = useCallback((event, edge) => {
        event.stopPropagation();

        if (selectedEdge && selectedEdge.id === edge.id) {
            // Already selected, add/move waypoint
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Get existing waypoints
            let waypoints = [];
            if (edge.data && edge.data.waypoints) {
                waypoints = [...edge.data.waypoints];
            } else if (edge.data && edge.data.waypoint) {
                waypoints = [edge.data.waypoint];
            }

            // Find insertion index
            const currentNodes = getNodes();
            const sourceNode = currentNodes.find(n => n.id === edge.source);
            const targetNode = currentNodes.find(n => n.id === edge.target);

            if (sourceNode && targetNode) {
                // Construct full path of points: Source -> W1 -> W2 -> ... -> Target
                // We need to handle handles if possible, but for now center/position is approximation
                // Actually, React Flow edges connect to handles. 
                // But for distance checking, node position is a decent enough proxy for large nodes.
                // Better: use the edge's sourceX/Y if available in the event? No, event is click.
                // The edge object passed to onEdgeClick doesn't have current sourceX/Y computed.
                // We can use node positions.

                const points = [
                    sourceNode.position,
                    ...waypoints,
                    targetNode.position
                ];

                // Find closest segment
                let minDistance = Infinity;
                let insertIndex = 0;

                for (let i = 0; i < points.length - 1; i++) {
                    const dist = getDistanceToSegment(position, points[i], points[i + 1]);
                    if (dist < minDistance) {
                        minDistance = dist;
                        insertIndex = i;
                    }
                }

                // Insert at found index
                takeSnapshot(currentNodes, getEdges());
                waypoints.splice(insertIndex, 0, { x: position.x, y: position.y });

                const updatedEdge = {
                    ...edge,
                    type: 'curved',
                    data: {
                        ...edge.data,
                        waypoints,
                        onWaypointDrag,
                        onWaypointClick,
                        onWaypointDragStart,
                        onWaypointDragStop
                    },
                    selected: true
                };
                setEdges((eds) => eds.map(e => e.id === edge.id ? updatedEdge : e));
            }
        } else {
            setSelectedEdge(edge);
            setSelectedNode(null);
            setEdges((eds) => eds.map((e) => ({
                ...e,
                selected: e.id === edge.id,
                animated: e.id === edge.id ? true : globalAnimate
            })));
        }
    }, [selectedEdge, screenToFlowPosition, setEdges, onWaypointDrag, onWaypointClick, getNodes, getEdges, globalAnimate, takeSnapshot, onWaypointDragStart, onWaypointDragStop]);

    const handleDeleteNode = useCallback(() => {
        if (!selectedNode) return;

        // Delete connected edges
        // const connectedEdges = edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id);

        takeSnapshot(getNodes(), getEdges());
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setSelectedNode(null);
    }, [selectedNode, setNodes, getNodes, getEdges, takeSnapshot]);

    const handleDeleteEdge = useCallback(() => {
        if (!selectedEdge) return;
        takeSnapshot(getNodes(), getEdges());
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
        setSelectedEdge(null);
    }, [selectedEdge, setEdges, getNodes, getEdges, takeSnapshot]);

    const handleDeleteSelected = useCallback(() => {
        const currentNodes = getNodes();
        const currentEdges = getEdges();

        const nodesToDelete = currentNodes.filter(n => n.selected);
        const edgesToDelete = currentEdges.filter(e => e.selected);

        if (nodesToDelete.length === 0 && edgesToDelete.length === 0) return;

        takeSnapshot(currentNodes, currentEdges);

        const nodeIdsToDelete = new Set(nodesToDelete.map(n => n.id));

        setNodes((nds) => nds.filter(n => !nodeIdsToDelete.has(n.id)));
        setEdges((eds) => eds.filter(e => !e.selected && !nodeIdsToDelete.has(e.source) && !nodeIdsToDelete.has(e.target)));

        setSelectedNode(null);
        setSelectedEdge(null);
        setSelectedWaypoint(null);
    }, [getNodes, getEdges, setNodes, setEdges, takeSnapshot]);

    // Keyboard event handler for deletion
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable) return;

            if (event.key === 'Delete' || event.key === 'Backspace') {
                if (selectedWaypoint) {
                    // Delete waypoint
                    event.preventDefault();
                    takeSnapshot(getNodes(), getEdges());
                    setEdges((eds) => eds.map(e => {
                        if (e.id === selectedWaypoint.edgeId) {
                            const waypoints = [...(e.data.waypoints || [])];
                            waypoints.splice(selectedWaypoint.index, 1);

                            // If no waypoints left, revert to default edge type
                            if (waypoints.length === 0) {
                                const { waypoints: _, selectedWaypointIndex: _swi, onWaypointDrag: _d, onWaypointClick: _c, ...restData } = e.data;
                                return {
                                    ...e,
                                    type: e.type.replace('curved', 'default'),
                                    data: { onWaypointDrag, onWaypointClick, onWaypointDragStart, onWaypointDragStop, ...restData }
                                };
                            }

                            const { selectedWaypointIndex: _swi, ...restData } = e.data;
                            return {
                                ...e,
                                data: {
                                    ...restData,
                                    waypoints
                                }
                            };
                        }
                        return e;
                    }));
                    setSelectedWaypoint(null);
                } else {
                    // Delete selected nodes/edges
                    handleDeleteSelected();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedWaypoint, setEdges, getNodes, getEdges, takeSnapshot, onWaypointDrag, onWaypointClick, onWaypointDragStart, onWaypointDragStop, handleDeleteSelected]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable) return;

            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                const currentNodes = getNodes();
                const currentEdges = getEdges();
                if (event.shiftKey) {
                    if (canRedo) redo(currentNodes, currentEdges, setNodes, setEdges);
                } else {
                    if (canUndo) undo(currentNodes, currentEdges, setNodes, setEdges);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [getNodes, getEdges, undo, redo, canUndo, canRedo, setNodes, setEdges]);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setSelectedEdge(null);
        setSelectedWaypoint(null);
        // Clear waypoint selection from edges
        setEdges((eds) => eds.map(e => {
            let newData = e.data;
            if (e.data?.selectedWaypointIndex !== undefined) {
                const { selectedWaypointIndex: _swi, ...restData } = e.data;
                newData = restData;
            }
            return { ...e, data: newData, selected: false, animated: globalAnimate };
        }));
    }, [setEdges, globalAnimate]);

    // Declared above
    // const handleDeleteNode = ...
    // const handleDeleteEdge = ...

    const toggleGlobalAnimation = () => {
        setGlobalAnimate(prev => !prev);
        setEdges(eds => eds.map(e => ({ ...e, animated: e.selected ? true : !globalAnimate })));
    };

    const onSelectionStart = useCallback((event) => {
        const flowStartPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        setSelectionStart(flowStartPos);

        const handleMouseMove = (moveEvent) => {
            const currentPos = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });

            const x = Math.min(flowStartPos.x, currentPos.x);
            const y = Math.min(flowStartPos.y, currentPos.y);
            const width = Math.abs(flowStartPos.x - currentPos.x);
            const height = Math.abs(flowStartPos.y - currentPos.y);

            const selectionBox = { x, y, width, height };
            const currentNodes = getNodes();
            
            setEdges((eds) => getUpdatedEdges(eds, currentNodes, selectionBox, globalAnimate, moveEvent.shiftKey));
        };

        const handleMouseUp = (upEvent) => {
            const finalPos = screenToFlowPosition({ x: upEvent.clientX, y: upEvent.clientY });
            
            const x = Math.min(flowStartPos.x, finalPos.x);
            const y = Math.min(flowStartPos.y, finalPos.y);
            const width = Math.abs(flowStartPos.x - finalPos.x);
            const height = Math.abs(flowStartPos.y - finalPos.y);

            if (width >= 5 || height >= 5) {
                const selectionBox = { x, y, width, height };
                const currentNodes = getNodes();
                setEdges((eds) => getUpdatedEdges(eds, currentNodes, selectionBox, globalAnimate, upEvent.shiftKey));
            }

            setSelectionStart(null);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [screenToFlowPosition, getNodes, setEdges, globalAnimate]);

    // onSelectionEnd is handled by global handleMouseUp
    const onSelectionEnd = useCallback(() => {
        setSelectionStart(null);
    }, []);

    const loadFlowFromText = useCallback((text) => {
        try {
            const { nodes: newNodes, edges: newEdges } = parseXMLToFlow(text);

            // Clear selection and manual moves
            setSelectedNode(null);
            setSelectedEdge(null);
            setSelectedWaypoint(null);
            setManuallyMovedNodes(new Set());

            // Force clear nodes and edges first
            setNodes([]);
            setEdges([]);

            // Set new state
            // Inject onUpdate callback into all nodes
            const nodesWithCallbacks = newNodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    onUpdate: onNodeUpdate
                }
            }));

            setNodes(nodesWithCallbacks);
            setEdges(newEdges.map(e => ({
                ...e,
                data: { ...e.data, onWaypointDrag, onWaypointClick, onWaypointDragStart, onWaypointDragStop }
            })));
        } catch (error) {
            console.error('Error parsing XML:', error);
            addToast('Error loading XML file. Please check the file format.', 'error');
        }
    }, [setNodes, setEdges, onWaypointDrag, onWaypointClick, onWaypointDragStart, onWaypointDragStop, onNodeUpdate, addToast]);

    const handleSave = useCallback(async () => {
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        const xml = flowToXML(currentNodes, currentEdges);

        if (fileHandle && window.showSaveFilePicker) {
            try {
                const writable = await fileHandle.createWritable();

                // Save positions before generating XML to ensure up-to-date state
                savePositions(currentNodes, manuallyMovedNodes, currentEdges);

                await writable.write(xml);
                await writable.close();
                // Optional: could show a toast here
            } catch (err) {
                console.error('Error saving to file:', err);
                addToast('Failed to save file.', 'error');
            }
        } else {
            downloadXML(xml);
        }
    }, [getNodes, getEdges, fileHandle, manuallyMovedNodes, addToast]);



    const handleSaveAs = useCallback(async () => {
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        const xml = flowToXML(currentNodes, currentEdges);
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    types: [{
                        description: 'XML Files',
                        accept: { 'application/xml': ['.xml'] },
                    }],
                });
                const writable = await handle.createWritable();

                // Save positions
                savePositions(currentNodes, manuallyMovedNodes, currentEdges);

                await writable.write(xml);
                await writable.close();
                setFileHandle(handle);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error saving file:', err);
                    addToast('Failed to save file.', 'error');
                }
            }
        } else {
            downloadXML(xml);
        }
    }, [getNodes, getEdges, manuallyMovedNodes, addToast]);

    const handleCreateNew = useCallback(async () => {
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    types: [{
                        description: 'XML Files',
                        accept: { 'application/xml': ['.xml'] },
                    }],
                });
                const writable = await handle.createWritable();
                const emptyXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <nodes></nodes>\n  <edges></edges>\n</root>';
                await writable.write(emptyXml);
                await writable.close();

                setFileHandle(handle);
                setNodes([]);
                setEdges([]);
                setIsProjectLoaded(true);
                setFlowKey(prev => prev + 1); // Force remount
                clearPositions(); // Clear saved positions for new file
                clearHistory(); // Clear undo history
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error creating file:', err);
                    addToast('Failed to create file.', 'error');
                }
            }
        } else {
            // Fallback for browsers without File System Access API
            const fileName = prompt('Enter file name for new project:', 'new_project.xml');
            if (fileName) {
                setNodes([]);
                setEdges([]);
                setIsProjectLoaded(true);
                setFileHandle(null); // No handle in fallback mode
                setFlowKey(prev => prev + 1); // Force remount
                clearPositions(); // Clear saved positions for new file
                clearHistory(); // Clear undo history
            }
        }
    }, [setNodes, setEdges, clearHistory, addToast]);

    const handleLoad = useCallback(async () => {
        if (window.showOpenFilePicker) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'XML Files',
                        accept: { 'application/xml': ['.xml'] },
                    }],
                    multiple: false,
                });
                const file = await handle.getFile();
                const text = await file.text();

                loadFlowFromText(text);
                setFileHandle(handle);
                setIsProjectLoaded(true);
                setFlowKey(prev => prev + 1); // Force remount
                clearPositions(); // Clear saved positions for new file
                clearHistory(); // Clear undo history
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error loading file:', err);
                    addToast('Failed to load file.', 'error');
                }
            }
        } else {
            fileInputRef.current?.click();
        }
    }, [loadFlowFromText, addToast, fileInputRef, clearHistory]);

    // Save shortcut
    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    const handleFileChange = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            loadFlowFromText(text);
            setFileHandle(null); // Reset handle as this is a new file from input
            setIsProjectLoaded(true);
            setFlowKey(prev => prev + 1); // Force remount
            clearPositions(); // Clear saved positions for new file
            clearHistory(); // Clear undo history

            // Reset file input
            event.target.value = '';
        } catch (error) {
            console.error('Error reading file:', error);
            addToast('Error reading file.', 'error');
        }
    }, [loadFlowFromText, clearHistory, addToast]);

    const handleExportVectorPDF = useCallback(() => {
        const nodesBounds = getNodesBounds(getNodes());
        const padding = 50;
        const width = nodesBounds.width + padding * 2;
        const height = nodesBounds.height + padding * 2;

        const transform = `translate(${(-nodesBounds.x + padding)}px, ${(-nodesBounds.y + padding)}px)`;

        const viewport = document.querySelector('.react-flow__viewport');

        if (!viewport) return;

        toSvg(viewport, {
            backgroundColor: '#ffffff',
            width: width,
            height: height,
            style: {
                width: width,
                height: height,
                transform: transform,
            },
        }).then((dataUrl) => {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Flow Export</title>
                            <style>
                                @page { size: auto; margin: 0mm; }
                                body { margin: 0; display: flex; justify-content: center; align-items: center; }
                                img { max-width: 100%; height: auto; }
                            </style>
                        </head>
                        <body>
                            <img src="${dataUrl}" onload="setTimeout(() => window.print(), 100);" />
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        }).catch((err) => {
            console.error('Error exporting Vector PDF:', err);
            addToast('Failed to export Vector PDF.', 'error');
        });
    }, [getNodes, addToast]);

    return (
        <div className="relative w-full h-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xml"
                style={{ display: 'none' }}
            />
            {!isProjectLoaded && <StartOverlay onCreate={handleCreateNew} onLoad={handleLoad} />}
            {isProjectLoaded && (
                <ReactFlow
                    key={flowKey}
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onReconnect={onReconnect}
                    onNodeDragStart={onNodeDragStart}
                    onNodeDragStop={onNodeDragStop}
                    onNodeDrag={onNodeDrag}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    deleteKeyCode={null}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    onPaneClick={onPaneClick}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onSelectionStart={onSelectionStart}
                    onSelectionEnd={onSelectionEnd}
                    selectionOnDrag={true}
                    selectionMode="partial"
                    panOnDrag={[1, 2]}
                    panOnScroll={false}
                >
                    <Background gap={20} size={1} color="hsl(var(--border))" />
                    <HelperLines />
                    <Controls />
                    <MiniMap pannable zoomable />
                    <Panel position="top-left" className="m-0 p-0 flex gap-2" style={{ top: '16px', left: '16px' }}>
                        <div className="bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 rounded-lg p-2 flex items-center gap-2">
                            <span className="font-semibold px-2 text-sm text-gray-700">Project Bot Admin</span>
                            <div className="h-4 w-px bg-gray-300 mx-1"></div>
                            <button onClick={handleCreateNew} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors" title="New File">
                                <FilePlus size={18} />
                            </button>
                            <button onClick={handleLoad} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors" title="Open File">
                                <FolderOpen size={18} />
                            </button>
                            <button onClick={handleSave} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors" title="Save">
                                <Save size={18} />
                            </button>
                            <button onClick={handleSaveAs} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors" title="Save As">
                                <SaveAll size={18} />
                            </button>
                            <button onClick={handleExportVectorPDF} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors" title="Export PDF">
                                <Download size={18} />
                            </button>
                            <div className="h-4 w-px bg-gray-300 mx-1"></div>
                            <button onClick={() => undo(nodes, edges, setNodes, setEdges)} disabled={!canUndo} className={`p-1.5 rounded-md transition-colors ${canUndo ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`} title="Undo">
                                <Undo2 size={18} />
                            </button>
                            <button onClick={() => redo(nodes, edges, setNodes, setEdges)} disabled={!canRedo} className={`p-1.5 rounded-md transition-colors ${canRedo ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`} title="Redo">
                                <Redo2 size={18} />
                            </button>
                        </div>
                    </Panel>

                    <Panel position="top-left" className="m-0 p-0" style={{ top: '90px', left: '16px' }}>
                        <div className="bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 rounded-lg p-1.5 flex flex-col gap-2 pointer-events-auto">
                            <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wider mb-1">Nodes</div>
                            <div
                                onDragStart={(event) => onDragStart(event, 'questionNode')}
                                draggable
                                className="w-10 h-10 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 rounded-md cursor-grab active:cursor-grabbing text-gray-600 transition-colors"
                                title="Question Node"
                            >
                                <MessageSquare size={20} />
                            </div>
                            <div
                                onDragStart={(event) => onDragStart(event, 'optionNode')}
                                draggable
                                className="w-10 h-10 flex items-center justify-center hover:bg-green-50 hover:text-green-600 rounded-md cursor-grab active:cursor-grabbing text-gray-600 transition-colors"
                                title="Option Node"
                            >
                                <List size={20} />
                            </div>
                            <div
                                onDragStart={(event) => onDragStart(event, 'documentNode')}
                                draggable
                                className="w-10 h-10 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 rounded-md cursor-grab active:cursor-grabbing text-gray-600 transition-colors"
                                title="Document Node"
                            >
                                <FileText size={20} />
                            </div>
                            <div
                                onDragStart={(event) => onDragStart(event, 'endNode')}
                                draggable
                                className="w-10 h-10 flex items-center justify-center hover:bg-red-50 hover:text-red-600 rounded-md cursor-grab active:cursor-grabbing text-gray-600 transition-colors"
                                title="End Node"
                            >
                                <StopCircle size={20} />
                            </div>
                        </div>
                    </Panel>

                    <Panel position="bottom-center" className="m-0 mb-8">
                        <div className="bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 rounded-full px-4 py-2 flex items-center gap-4">
                            <button
                                onClick={toggleGlobalAnimation}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${globalAnimate ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'hover:bg-gray-100 text-gray-700'}`}
                            >
                                {globalAnimate ? <Pause size={16} /> : <Play size={16} />}
                                <span>{globalAnimate ? 'Running' : 'Run Flow'}</span>
                            </button>
                            <div className="w-px h-5 bg-gray-300"></div>
                            <div className="relative">
                                <button
                                    onClick={() => setShowShortcuts(!showShortcuts)}
                                    className={`p-1.5 rounded-full transition-colors ${showShortcuts ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
                                    title="Keyboard Shortcuts"
                                >
                                    <Keyboard size={18} />
                                </button>
                                {showShortcuts && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white/95 backdrop-blur-md shadow-xl border border-gray-200 rounded-xl p-4 w-[320px] text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Controls</h3>
                                        
                                        <div className="mb-3">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Navigation</h4>
                                            <div className="flex flex-col gap-1.5 text-gray-600 text-xs">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-gray-400">•</span>
                                                    <span><strong>Pan:</strong> Middle or Right mouse button + drag</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-gray-400">•</span>
                                                    <span><strong>Zoom:</strong> Scroll wheel</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-gray-400">•</span>
                                                    <span><strong>Select:</strong> Left click + drag for box selection</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Keyboard Shortcuts</h4>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center text-gray-600">
                                                    <span>Save</span>
                                                    <div className="flex gap-1">
                                                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">⌘/Ctrl</kbd>
                                                        <span className="text-gray-400">+</span>
                                                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">S</kbd>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-gray-600">
                                                    <span>Undo</span>
                                                    <div className="flex gap-1">
                                                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">⌘/Ctrl</kbd>
                                                        <span className="text-gray-400">+</span>
                                                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Z</kbd>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-gray-600">
                                                    <span>Redo</span>
                                                    <div className="flex gap-1">
                                                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Shift</kbd>
                                                        <span className="text-gray-400">+</span>
                                                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Z</kbd>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-gray-600">
                                                    <span>Delete</span>
                                                    <div className="flex gap-1">
                                                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Del</kbd>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Panel>

                    <Panel position="top-right" className="top-20 right-4">
                        {(selectedNode || selectedEdge || selectedWaypoint || nodes.some(n => n.selected) || edges.some(e => e.selected)) && (
                            <div className="bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 rounded-lg p-2 flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-200 min-w-[180px]">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-1">Selected</div>
                                
                                {selectedNode && !nodes.some(n => n.selected && n.id !== selectedNode.id) && !edges.some(e => e.selected) && (
                                    <button
                                        onClick={handleDeleteNode}
                                        className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-md transition-colors text-sm w-full"
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete Node</span>
                                    </button>
                                )}

                                {selectedEdge && !edges.some(e => e.selected && e.id !== selectedEdge.id) && !nodes.some(n => n.selected) && (
                                    <button
                                        onClick={handleDeleteEdge}
                                        className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-md transition-colors text-sm w-full"
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete Edge</span>
                                    </button>
                                )}

                                {(nodes.filter(n => n.selected).length + edges.filter(e => e.selected).length > 1) && (
                                    <button
                                        onClick={handleDeleteSelected}
                                        className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-md transition-colors text-sm w-full"
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete Selected ({nodes.filter(n => n.selected).length + edges.filter(e => e.selected).length})</span>
                                    </button>
                                )}

                                {selectedWaypoint && (
                                    <div className="text-xs text-center text-gray-500 py-1 border-t mt-1 pt-2">
                                        Waypoint Selected <br /> (Press Del to remove)
                                    </div>
                                )}
                            </div>
                        )}
                    </Panel>

                </ReactFlow>
            )}
        </div >
    );
};

const FlowModeler = () => {
    return (
        <ReactFlowProvider>
            <FlowModelerContent />
        </ReactFlowProvider>
    );
};

export default FlowModeler;
