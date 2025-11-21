import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MiniMap,
    Panel,
    ReactFlowProvider,
    useReactFlow,
    BezierEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { parseXMLToFlow } from '../utils/xmlToFlow';
import { savePositions, clearPositions } from '../utils/positionManager';
import { flowToXML, downloadXML } from '../utils/flowToXML';
import { QuestionNode, OptionNode, DocumentNode, WaypointNode } from './CustomNodes';

const FlowModelerContent = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [globalAnimate, setGlobalAnimate] = useState(false);
    const [manuallyMovedNodes, setManuallyMovedNodes] = useState(new Set());
    const { screenToFlowPosition } = useReactFlow();

    // Edge Visibility State
    const [edgeVisibility, setEdgeVisibility] = useState({
        qToO: true, // Question -> Option
        oToQ: true, // Option -> Question
        doc: true   // Option -> Document
    });

    // Handle node data updates from double-click edits
    const handleNodeUpdate = useCallback((nodeId, newData) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId ? { ...node, data: newData } : node
            )
        );
    }, [setNodes]);

    // Define custom node types with update handler
    const nodeTypes = useMemo(() => ({
        questionNode: (props) => <QuestionNode {...props} data={{ ...props.data, onUpdate: handleNodeUpdate }} />,
        optionNode: (props) => <OptionNode {...props} data={{ ...props.data, onUpdate: handleNodeUpdate }} />,
        documentNode: (props) => <DocumentNode {...props} data={{ ...props.data, onUpdate: handleNodeUpdate }} />,
        waypointNode: WaypointNode
    }), [handleNodeUpdate]);

    // Define edge types mapping to standard BezierEdge to allow custom type strings for filtering
    const edgeTypes = useMemo(() => ({
        'q-to-o': BezierEdge,
        'o-to-q': BezierEdge,
        'o-to-d': BezierEdge,
        'default': BezierEdge
    }), []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/questions.xml');
                const text = await response.text();
                const { nodes: layoutedNodes, edges: layoutedEdges } = parseXMLToFlow(text);

                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
            } catch (error) {
                console.error("Error fetching or parsing XML:", error);
            }
        };

        fetchData();
    }, [setNodes, setEdges]);

    // Update edge visibility when toggles change
    useEffect(() => {
        setEdges((eds) => eds.map((edge) => {
            let isHidden = false;
            if (edge.type === 'q-to-o' && !edgeVisibility.qToO) isHidden = true;
            if (edge.type === 'o-to-q' && !edgeVisibility.oToQ) isHidden = true;
            if (edge.type === 'o-to-d' && !edgeVisibility.doc) isHidden = true; // Assuming o-to-d type for docs
            // Check if edge connects to a document (fallback if type isn't explicit)
            if (edge.target.startsWith('doc-') && !edgeVisibility.doc) isHidden = true;

            return { ...edge, hidden: isHidden };
        }));
    }, [edgeVisibility, setEdges]);

    const onConnect = useCallback((params) => {
        // Determine edge type and styling based on source/target
        const isQuestionSource = params.source.startsWith('q') && !params.source.includes('-opt');
        const isDocumentTarget = params.target.startsWith('doc-') || params.target.startsWith('documentNode-');

        let edgeType = 'default';
        let edgeStyle = { stroke: '#333', strokeWidth: 2, strokeDasharray: '5,5' };

        if (isQuestionSource) {
            // Q→O: Thin, solid
            edgeType = 'q-to-o';
            edgeStyle = { stroke: '#9ca3af', strokeWidth: 1 };
        } else if (isDocumentTarget) {
            // O→D: Bold, dashed (Blueish for docs maybe?)
            edgeType = 'o-to-d';
            edgeStyle = { stroke: '#007bff', strokeWidth: 2, strokeDasharray: '5,5' };
        } else {
            // O→Q: Bold, dashed
            edgeType = 'o-to-q';
            edgeStyle = { stroke: '#333', strokeWidth: 2, strokeDasharray: '5,5' };
        }

        const newEdge = {
            ...params,
            animated: false,
            type: edgeType,
            id: `edge-${params.source}-${params.target}-${Date.now()}`,
            style: edgeStyle
        };
        setEdges((eds) => addEdge(newEdge, eds));
    }, [setEdges]);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
        setSelectedEdge(null);
        // Restore edges when clicking a node (remove highlight, but don't change opacity of others)
        setEdges((eds) => eds.map((e) => {
            const originalStyle = e.data?.originalStyle || e.style;
            return {
                ...e,
                animated: globalAnimate,
                style: { ...originalStyle, opacity: 1 }, // Ensure full opacity
                data: { ...e.data, originalStyle: undefined }
            };
        }));
    }, [globalAnimate, setEdges]);

    const onEdgeClick = useCallback((event, edge) => {
        setSelectedEdge(edge);
        setSelectedNode(null);

        // Update edges: highlight selected, DO NOT mute others
        setEdges((eds) => eds.map((e) => {
            if (e.id === edge.id) {
                // Selected edge: animated with highlight
                const originalStyle = e.data?.originalStyle || e.style;
                const baseStrokeWidth = originalStyle?.strokeWidth || 2;

                return {
                    ...e,
                    animated: true,
                    data: { ...e.data, originalStyle },
                    style: {
                        ...originalStyle,
                        stroke: '#f59e0b',
                        strokeWidth: baseStrokeWidth + 1,
                        opacity: 1
                    }
                };
            } else {
                // Other edges: Restore to original if they were highlighted, ensure opacity 1
                const originalStyle = e.data?.originalStyle || e.style;
                return {
                    ...e,
                    animated: globalAnimate, // Respect global animation
                    data: { ...e.data, originalStyle: undefined }, // Clear stored original
                    style: { ...originalStyle, opacity: 1 } // No muting!
                };
            }
        }));
    }, [setEdges, globalAnimate]);

    const onEdgeDoubleClick = useCallback((event, edge) => {
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();

        // Calculate position for new waypoint
        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        // Create Waypoint Node
        const waypointId = `waypoint-${Date.now()}`;
        const waypointNode = {
            id: waypointId,
            type: 'waypointNode',
            position: { x: position.x - 7, y: position.y - 7 }, // Center the 14px node
            data: { label: '' },
            draggable: true,
        };

        // Create two new edges
        const edge1 = {
            ...edge,
            id: `${edge.source}-${waypointId}`,
            target: waypointId,
            selected: false
        };

        const edge2 = {
            ...edge,
            id: `${waypointId}-${edge.target}`,
            source: waypointId,
            selected: false
        };

        // Update state: Add waypoint, remove old edge, add new edges
        setNodes((nds) => nds.concat(waypointNode));
        setEdges((eds) => eds.filter(e => e.id !== edge.id).concat([edge1, edge2]));

        // Track manual move for the new waypoint so it gets saved
        setManuallyMovedNodes((prev) => new Set(prev).add(waypointId));

    }, [screenToFlowPosition, setNodes, setEdges]);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setSelectedEdge(null);

        // Restore all edges to original state
        setEdges((eds) => eds.map((e) => {
            const originalStyle = e.data?.originalStyle || e.style;
            return {
                ...e,
                animated: globalAnimate,
                style: { ...originalStyle, opacity: 1 },
                data: { ...e.data, originalStyle: undefined }
            };
        }));
    }, [globalAnimate, setEdges]);

    const handleDeleteNode = useCallback(() => {
        if (selectedNode) {
            if (selectedNode.type === 'waypointNode') {
                // Handle Waypoint Deletion: Reconnect edges
                const incomingEdge = edges.find(e => e.target === selectedNode.id);
                const outgoingEdge = edges.find(e => e.source === selectedNode.id);

                if (incomingEdge && outgoingEdge) {
                    // Create merged edge preserving properties of incoming edge (or outgoing)
                    const mergedEdge = {
                        ...incomingEdge,
                        id: `${incomingEdge.source}-${outgoingEdge.target}-${Date.now()}`,
                        target: outgoingEdge.target,
                        selected: true
                    };
                    setEdges((eds) => eds.filter(e => e.target !== selectedNode.id && e.source !== selectedNode.id).concat(mergedEdge));
                } else {
                    // Just remove edges if not fully connected
                    setEdges((eds) => eds.filter(e => e.target !== selectedNode.id && e.source !== selectedNode.id));
                }
                setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
            } else {
                // Normal node deletion
                setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
            }
            setSelectedNode(null);
        }
    }, [selectedNode, setNodes, setEdges, edges]);

    const handleDeleteEdge = useCallback(() => {
        if (selectedEdge) {
            setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
            setSelectedEdge(null);
        }
    }, [selectedEdge, setEdges]);

    const toggleGlobalAnimation = useCallback(() => {
        const newState = !globalAnimate;
        setGlobalAnimate(newState);
        setEdges((eds) => eds.map((e) => ({
            ...e,
            animated: newState
        })));
    }, [globalAnimate, setEdges]);

    // Drag and Drop Handlers
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

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Simple overlap prevention: check distance to other nodes
            // If too close, shift slightly (simple heuristic)
            let adjustedPosition = { ...position };
            const minDistance = 50;
            let overlapFound = true;
            let attempts = 0;

            while (overlapFound && attempts < 10) {
                overlapFound = false;
                for (const node of nodes) {
                    const dx = node.position.x - adjustedPosition.x;
                    const dy = node.position.y - adjustedPosition.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistance) {
                        overlapFound = true;
                        adjustedPosition.x += 20;
                        adjustedPosition.y += 20;
                        break;
                    }
                }
                attempts++;
            }

            let newNodeData = { label: 'New Node' };
            if (type === 'questionNode') {
                newNodeData = { label: 'New Question', questionId: 'new', tooltip: null };
            } else if (type === 'optionNode') {
                newNodeData = { label: 'New Option' };
            } else if (type === 'documentNode') {
                newNodeData = { label: 'New Document', docType: 'optional' };
            }

            const newNode = {
                id: `${type}-${Date.now()}`,
                type,
                position: adjustedPosition,
                data: newNodeData,
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes, nodes],
    );

    return (
        <div style={{ width: '100vw', height: '100vh', userSelect: 'none', WebkitUserSelect: 'none' }} ref={reactFlowWrapper}>
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 5,
                background: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '12px'
            }}>
                <button onClick={handleSaveXML} style={{ padding: '6px 12px', cursor: 'pointer', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Save XML
                </button>
                <button onClick={handleSavePositions} style={{ padding: '6px 12px', cursor: 'pointer', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Save Positions
                </button>
                <button onClick={handleResetLayout} style={{ padding: '6px 12px', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Reset Layout
                </button>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                deleteKeyCode="Delete"
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onEdgeDoubleClick={onEdgeDoubleClick}
                onPaneClick={onPaneClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
                selectionOnDrag={true}
                selectionMode="partial"
                panOnDrag={[1]} // Middle mouse button only (0=left, 1=middle, 2=right)
            >
                <Background />
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
