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
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { QuestionNode, OptionNode, DocumentNode, EndNode } from './CustomNodes';
import CustomCurvedEdge from './CustomCurvedEdge';
import { parseXMLToFlow } from '../utils/xmlToFlow';
import { savePositions, clearPositions } from '../utils/positionManager';
import { flowToXML, downloadXML } from '../utils/flowToXML';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useHelperLines } from '../hooks/useFlowHelperLines';

const nodeTypes = {
    questionNode: QuestionNode,
    optionNode: OptionNode,
    questionNode: QuestionNode,
    optionNode: OptionNode,
    documentNode: DocumentNode,
    endNode: EndNode
};

const FlowModelerContent = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [edgeVisibility, setEdgeVisibility] = useState({ qToO: true, oToQ: true, doc: true });
    const [globalAnimate, setGlobalAnimate] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [selectedWaypoint, setSelectedWaypoint] = useState(null); // { edgeId, index }
    const [manuallyMovedNodes, setManuallyMovedNodes] = useState(new Set());
    const { onNodeDrag: onNodeDragHelper, resetHelperLines, HelperLines } = useHelperLines();
    const { screenToFlowPosition, project } = useReactFlow();
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo();

    const dragStartSnapshot = useRef(null);
    const fileInputRef = useRef(null);
    const [flowKey, setFlowKey] = useState(0); // Key to force re-render of ReactFlow

    const edgeTypes = useMemo(() => ({
        'q-to-o': BezierEdge,
        'o-to-q': BezierEdge,
        'o-to-d': BezierEdge,
        'default': BezierEdge,
        'curved': CustomCurvedEdge
    }), []);

    const onWaypointDragStart = useCallback(() => {
        dragStartSnapshot.current = { nodes, edges };
    }, [nodes, edges]);

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

            const edgesChanged = JSON.stringify(getEdgeState(edges)) !== JSON.stringify(getEdgeState(oldEdges));
            if (edgesChanged) {
                takeSnapshot(oldNodes, oldEdges);
            }
            dragStartSnapshot.current = null;
        }
    }, [nodes, edges, takeSnapshot]);

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
                const { selectedWaypointIndex, ...restData } = e.data;
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

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('questions.xml');
                const text = await response.text();
                const { nodes: initialNodes, edges: initialEdges } = parseXMLToFlow(text);
                setNodes(initialNodes);
                // Attach onWaypointDrag to loaded edges
                setEdges(initialEdges.map(e => ({
                    ...e,
                    data: { ...e.data, onWaypointDrag, onWaypointClick, onWaypointDragStart, onWaypointDragStop }
                })));
            } catch (error) {
                console.error('Error loading XML:', error);
            }
        };
        loadData();
    }, [setNodes, setEdges, onWaypointDrag]);

    const getEdgeParams = useCallback((sourceNode, targetNode) => {
        let type = 'default';
        let animated = false;
        let markerEnd = { type: MarkerType.ArrowClosed };
        let style = { strokeWidth: 2 };

        // Q→O edges: Thin, solid, gray
        if (sourceNode?.type === 'questionNode' && targetNode?.type === 'optionNode') {
            type = 'q-to-o';
            style = { stroke: '#9ca3af', strokeWidth: 1 };
        }
        // O→Q edges: Bold, dashed, dark gray
        else if (sourceNode?.type === 'optionNode' && targetNode?.type === 'questionNode') {
            type = 'o-to-q';
            style = { stroke: '#333', strokeWidth: 2, strokeDasharray: '5,5' };
        }
        // O→D edges: Bold, dashed, blue
        else if (sourceNode?.type === 'optionNode' && targetNode?.type === 'documentNode') {
            type = 'o-to-d';
            style = { stroke: '#007bff', strokeWidth: 2, strokeDasharray: '5,5' };
        }
        // Any→End edges: Solid, red/gray
        else if (targetNode?.type === 'endNode') {
            type = 'default';
            style = { stroke: '#dc2626', strokeWidth: 2 };
        }

        return { type, animated, markerEnd, style };
    }, []);

    const onConnect = useCallback((params) => {
        takeSnapshot(nodes, edges);
        const { source, target } = params;

        // Prevent self-loops
        if (source === target) return;

        // Check for existing connection
        const exists = edges.some(e =>
            (e.source === source && e.target === target) ||
            (e.source === target && e.target === source)
        );
        if (exists) return;

        // Determine edge type and style based on nodes
        const sourceNode = nodes.find(n => n.id === source);
        const targetNode = nodes.find(n => n.id === target);

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
    }, [nodes, edges, globalAnimate, setEdges, onWaypointDrag, getEdgeParams]);

    const onReconnect = useCallback((oldEdge, newConnection) => {
        takeSnapshot(nodes, edges);
        const { source, target } = newConnection;

        // Prevent self-loops
        if (source === target) return;

        // Check for existing connection (excluding the one we are reconnecting)
        const exists = edges.some(e =>
            e.id !== oldEdge.id &&
            ((e.source === source && e.target === target) ||
                (e.source === target && e.target === source))
        );
        if (exists) return;

        const oldSourceNode = nodes.find(n => n.id === oldEdge.source);
        const oldTargetNode = nodes.find(n => n.id === oldEdge.target);
        const newSourceNode = nodes.find(n => n.id === source);
        const newTargetNode = nodes.find(n => n.id === target);

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
    }, [nodes, edges, setEdges, getEdgeParams, onWaypointDrag, onWaypointClick, globalAnimate]);

    const onNodeDragStart = useCallback(() => {
        dragStartSnapshot.current = { nodes, edges };
    }, [nodes, edges]);

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

            const nodesChanged = JSON.stringify(getNodeState(nodes)) !== JSON.stringify(getNodeState(oldNodes));
            if (nodesChanged) {
                takeSnapshot(oldNodes, oldEdges);
            }
            dragStartSnapshot.current = null;
        }
    }, [nodes, edges, takeSnapshot, resetHelperLines]);

    const onNodeDrag = useCallback((event, node) => {
        onNodeDragHelper(event, node, nodes, setNodes);
        setManuallyMovedNodes((prev) => new Set(prev).add(node.id));
    }, [nodes, setNodes, onNodeDragHelper]);

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

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
                data: { label: `New ${type}` },
            };

            takeSnapshot(nodes, edges);
            setNodes((nds) => nds.concat(newNode));
            setManuallyMovedNodes((prev) => new Set(prev).add(newNode.id));
        },
        [screenToFlowPosition, setNodes, nodes, edges, takeSnapshot]
    );

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
        setSelectedEdge(null);
        setSelectedWaypoint(null);
        // Clear waypoint selection from edges
        setEdges((eds) => eds.map(e => {
            let newData = e.data;
            if (e.data?.selectedWaypointIndex !== undefined) {
                const { selectedWaypointIndex, ...restData } = e.data;
                newData = restData;
            }
            return { ...e, data: newData, selected: false, animated: globalAnimate };
        }));
    }, [setEdges, globalAnimate]);

    const getDistanceToSegment = (p, v, w) => {
        const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
        if (l2 === 0) return Math.sqrt(Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2));
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projection = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
        return Math.sqrt(Math.pow(p.x - projection.x, 2) + Math.pow(p.y - projection.y, 2));
    };

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
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

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
                takeSnapshot(nodes, edges);
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
    }, [selectedEdge, screenToFlowPosition, setEdges, onWaypointDrag, onWaypointClick, nodes, edges, globalAnimate, takeSnapshot]);

    // Keyboard event handler for deletion
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable) return;

            if (event.key === 'Delete' || event.key === 'Backspace') {
                if (selectedWaypoint) {
                    // Delete waypoint
                    event.preventDefault();
                    takeSnapshot(nodes, edges);
                    setEdges((eds) => eds.map(e => {
                        if (e.id === selectedWaypoint.edgeId) {
                            const waypoints = [...(e.data.waypoints || [])];
                            waypoints.splice(selectedWaypoint.index, 1);

                            // If no waypoints left, revert to default edge type
                            if (waypoints.length === 0) {
                                const { waypoints: _, selectedWaypointIndex, onWaypointDrag, onWaypointClick, ...restData } = e.data;
                                return {
                                    ...e,
                                    type: e.type.replace('curved', 'default'),
                                    data: { onWaypointDrag, onWaypointClick, onWaypointDragStart, onWaypointDragStop, ...restData }
                                };
                            }

                            const { selectedWaypointIndex, ...restData } = e.data;
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
                } else if (selectedNode) {
                    // Delete node (existing behavior)
                    handleDeleteNode();
                } else if (selectedEdge) {
                    // Delete edge (existing behavior)
                    handleDeleteEdge();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedWaypoint, selectedNode, selectedEdge, setEdges, nodes, edges, takeSnapshot]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable) return;

            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                if (event.shiftKey) {
                    if (canRedo) redo(nodes, edges, setNodes, setEdges);
                } else {
                    if (canUndo) undo(nodes, edges, setNodes, setEdges);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, edges, undo, redo, canUndo, canRedo, setNodes, setEdges]);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setSelectedEdge(null);
        setSelectedWaypoint(null);
        // Clear waypoint selection from edges
        setEdges((eds) => eds.map(e => {
            let newData = e.data;
            if (e.data?.selectedWaypointIndex !== undefined) {
                const { selectedWaypointIndex, ...restData } = e.data;
                newData = restData;
            }
            return { ...e, data: newData, selected: false, animated: globalAnimate };
        }));
    }, [setEdges, globalAnimate]);

    const handleDeleteNode = useCallback(() => {
        if (!selectedNode) return;

        // Delete connected edges
        const connectedEdges = edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id);

        takeSnapshot(nodes, edges);
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setSelectedNode(null);
    }, [selectedNode, setNodes, setEdges, nodes, edges, takeSnapshot]);

    const handleDeleteEdge = useCallback(() => {
        if (!selectedEdge) return;
        takeSnapshot(nodes, edges);
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
        setSelectedEdge(null);
    }, [selectedEdge, setEdges, nodes, edges, takeSnapshot]);

    const toggleGlobalAnimation = () => {
        setGlobalAnimate(prev => !prev);
        setEdges(eds => eds.map(e => ({ ...e, animated: e.selected ? true : !globalAnimate })));
    };

    const handleSave = useCallback(() => {
        const xml = flowToXML(nodes, edges);
        downloadXML(xml);
    }, [nodes, edges]);

    const handleLoad = useCallback(() => {
        fileInputRef.current?.click();
    }, []);
    ref = { fileInputRef }
    onChange = { handleFileChange }
    accept = ".xml"
    style = {{ display: 'none' }
}
            />
    < ReactFlow
key = { flowKey }
nodes = { nodes }
edges = { edges }
onNodesChange = { onNodesChange }
onEdgesChange = { onEdgesChange }
onConnect = { onConnect }
onReconnect = { onReconnect }
onNodeDragStart = { onNodeDragStart }
onNodeDragStop = { onNodeDragStop }
onNodeDrag = { onNodeDrag }
nodeTypes = { nodeTypes }
edgeTypes = { edgeTypes }
fitView
deleteKeyCode = { null}
onNodeClick = { onNodeClick }
onEdgeClick = { onEdgeClick }
onPaneClick = { onPaneClick }
onDragOver = { onDragOver }
onDrop = { onDrop }
selectionOnDrag = { true}
selectionMode = "partial"
panOnDrag = { [1]}
panOnScroll = { true}
    >
                <Background />
                <HelperLines />
                <Controls />
                <MiniMap pannable zoomable />
                <Panel position="top-right" style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    minWidth: '200px',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#1f2937' }}>
                        Drag to Add Nodes
                    </div>

                    <div
                        onDragStart={(event) => onDragStart(event, 'questionNode')}
                        draggable
                        style={{
                            padding: '8px',
                            marginBottom: '6px',
                            background: '#667eea',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'grab',
                            fontSize: '11px',
                            fontWeight: '500',
                            textAlign: 'center'
                        }}
                    >
                        ➕ Question
                    </div>
                    <div
                        onDragStart={(event) => onDragStart(event, 'optionNode')}
                        draggable
                        style={{
                            padding: '8px',
                            marginBottom: '6px',
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #d97706',
                            borderRadius: '4px',
                            cursor: 'grab',
                            fontSize: '11px',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}
                    >
                        ◇ Option
                    </div>
                    <div
                        onDragStart={(event) => onDragStart(event, 'documentNode')}
                        draggable
                        style={{
                            padding: '8px',
                            marginBottom: '10px',
                            background: '#2563eb',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'grab',
                            fontSize: '11px',
                            fontWeight: '500',
                            textAlign: 'center'
                        }}
                    >
                        ➕ Document
                    </div>
                    <div
                        onDragStart={(event) => onDragStart(event, 'endNode')}
                        draggable
                        style={{
                            padding: '8px',
                            marginBottom: '10px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #dc2626',
                            borderRadius: '4px',
                            cursor: 'grab',
                            fontSize: '11px',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}
                    >
                        🛑 End Event
                    </div>

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#1f2937' }}>
                            Edge Visibility
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', marginBottom: '4px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={edgeVisibility.qToO}
                                onChange={(e) => setEdgeVisibility(prev => ({ ...prev, qToO: e.target.checked }))}
                                style={{ marginRight: '6px' }}
                            />
                            Questions → Options
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', marginBottom: '4px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={edgeVisibility.oToQ}
                                onChange={(e) => setEdgeVisibility(prev => ({ ...prev, oToQ: e.target.checked }))}
                                style={{ marginRight: '6px' }}
                            />
                            Options → Questions
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', marginBottom: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={edgeVisibility.doc}
                                onChange={(e) => setEdgeVisibility(prev => ({ ...prev, doc: e.target.checked }))}
                                style={{ marginRight: '6px' }}
                            />
                            Documents
                        </label>
                    </div>

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                        <button
                            onClick={handleSave}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginBottom: '8px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                            }}
                        >
                            💾 Save XML
                        </button>
                        <button
                            onClick={handleLoad}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginBottom: '8px',
                                background: '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                            }}
                        >
                            📂 Load XML
                        </button>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <button
                                onClick={() => undo(nodes, edges, setNodes, setEdges)}
                                disabled={!canUndo}
                                style={{
                                    flex: 1,
                                    padding: '6px',
                                    background: canUndo ? '#3b82f6' : '#9ca3af',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: canUndo ? 'pointer' : 'not-allowed',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                }}
                            >
                                ↩️ Undo
                            </button>
                            <button
                                onClick={() => redo(nodes, edges, setNodes, setEdges)}
                                disabled={!canRedo}
                                style={{
                                    flex: 1,
                                    padding: '6px',
                                    background: canRedo ? '#3b82f6' : '#9ca3af',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: canRedo ? 'pointer' : 'not-allowed',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                }}
                            >
                                ↪️ Redo
                            </button>
                        </div>

                        <button
                            onClick={toggleGlobalAnimation}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginBottom: '8px',
                                background: globalAnimate ? '#10b981' : '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                            }}
                        >
                            {globalAnimate ? '⏸️ Pause Flow' : '▶️ Show Flow'}
                        </button>

                        {selectedNode && (
                            <button
                                onClick={handleDeleteNode}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginBottom: '4px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                }}
                            >
                                🗑️ Delete Node
                            </button>
                        )}

                        {selectedEdge && (
                            <button
                                onClick={handleDeleteEdge}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                }}
                            >
                                🗑️ Delete Edge
                            </button>
                        )}
                    </div>
                </Panel>
            </ReactFlow >
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
