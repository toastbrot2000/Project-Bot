import { XMLParser } from 'fast-xml-parser';
import dagre from 'dagre';
import { loadPositions } from './positionManager';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    ignoreDeclaration: true,
    trimValues: true
});

const nodeWidth = 280;
const nodeHeight = 120;
const optionNodeWidth = 100;
const optionNodeHeight = 100;

const getLayoutedElements = (nodes, edges) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 120, nodesep: 80 });

    nodes.forEach((node) => {
        const width = node.type === 'optionNode' ? optionNodeWidth : nodeWidth;
        const height = node.type === 'optionNode' ? optionNodeHeight : nodeHeight;
        dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    // Find minimum X to place documents on the left
    let minX = Infinity;
    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        if (nodeWithPosition.x < minX) minX = nodeWithPosition.x;
    });

    const documentLeftX = minX - 450;
    const documentGap = 20; // Small gap between stacked documents

    // Separate document nodes for special positioning
    const documentNodes = nodes.filter(node => node.type === 'documentNode');
    const otherNodes = nodes.filter(node => node.type !== 'documentNode');

    // Position non-document nodes using dagre layout
    // Load saved positions
    const savedPositions = loadPositions();

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const width = node.type === 'optionNode' ? optionNodeWidth : nodeWidth;
        const height = node.type === 'optionNode' ? optionNodeHeight : nodeHeight;

        // Check if this node has a saved manual position
        if (savedPositions[node.id] && savedPositions[node.id].manual) {
            node.position = {
                x: savedPositions[node.id].x,
                y: savedPositions[node.id].y
            };
            // Mark as manually positioned in data so we can track it
            node.data = { ...node.data, manualPosition: true };
        } else {
            // Use auto-layout
            node.position = {
                x: nodeWithPosition.x - width / 2,
                y: nodeWithPosition.y - height / 2,
            };
        }
    });

    // Build a map of document ID to connected option node Y positions
    const documentToOptionY = {};
    edges.forEach((edge) => {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode && targetNode.type === 'documentNode') {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (sourceNode && sourceNode.position) {
                if (!documentToOptionY[edge.target]) {
                    documentToOptionY[edge.target] = [];
                }
                documentToOptionY[edge.target].push(sourceNode.position.y);
            }
        }
    });

    // Sort documents by their average connected option Y position
    const sortedDocuments = [...documentNodes].sort((a, b) => {
        const aY = documentToOptionY[a.id] ?
            documentToOptionY[a.id].reduce((sum, y) => sum + y, 0) / documentToOptionY[a.id].length :
            0;
        const bY = documentToOptionY[b.id] ?
            documentToOptionY[b.id].reduce((sum, y) => sum + y, 0) / documentToOptionY[b.id].length :
            0;
        return aY - bY;
    });

    // Position documents vertically, near their connected options
    let previousDocY = null;
    sortedDocuments.forEach((node) => {
        // Check if manual position exists
        if (savedPositions.positions && savedPositions.positions[node.id] && savedPositions.positions[node.id].manual) {
            node.position = {
                x: savedPositions.positions[node.id].x,
                y: savedPositions.positions[node.id].y
            };
            node.data = { ...node.data, manualPosition: true };

            // Update previousDocY so next auto-positioned node respects this one
            // Only update if this node is in the document column (roughly)
            if (Math.abs(node.position.x - documentLeftX) < 100) {
                previousDocY = node.position.y;
            }
            return;
        }

        let targetY = 0;

        // Calculate target Y based on connected option nodes
        if (documentToOptionY[node.id] && documentToOptionY[node.id].length > 0) {
            targetY = documentToOptionY[node.id].reduce((sum, y) => sum + y, 0) / documentToOptionY[node.id].length;
        }

        // Ensure minimum gap from previous document
        if (previousDocY !== null && targetY < previousDocY + nodeHeight + documentGap) {
            targetY = previousDocY + nodeHeight + documentGap;
        }

        node.position = {
            x: documentLeftX,
            y: targetY,
        };

        previousDocY = targetY;
    });

    // Reconstruct Waypoints
    if (savedPositions.waypoints && savedPositions.waypoints.length > 0) {
        // Add waypoint nodes
        savedPositions.waypoints.forEach(wp => {
            nodes.push(wp);
        });

        // Add waypoint edges
        if (savedPositions.waypointEdges) {
            savedPositions.waypointEdges.forEach(wpEdge => {
                edges.push(wpEdge);
            });
        }

        // Remove original edges that are now routed through waypoints
        // Logic: If we have A->W and W->B, we should remove A->B if it exists
        // But A->B might have a different ID than what we can easily guess.
        // However, we can look at the waypoint edges to find the original source and target.
        // Actually, simpler: If we have a waypoint edge A->W, we know A is connected to something else via W.
        // But we need to know what B is to remove A->B.
        // Let's assume the saved waypoint edges are sufficient to define the graph.
        // But we generated "logical" edges from XML. We need to remove those that conflict.

        // Strategy:
        // 1. Identify all "logical" connections that are now handled by waypoints.
        //    This is hard because a chain A->W1->W2->B replaces A->B.
        // 2. Alternative: When saving, we saved the *entire* edge set involving waypoints.
        //    So we just need to remove any edge in `edges` that connects the same Source/Target pair 
        //    as a chain of waypoints? No, that's expensive to calculate.

        // 3. Better Strategy: 
        //    The `waypointEdges` contain edges like `q1-opt1-waypoint-123` (Source->W) and `waypoint-123-q2` (W->Target).
        //    The original edge was `q1-opt1-to-q2`.
        //    We can't easily match IDs.
        //    BUT, we can check if there is a path from A to B via waypoints.

        //    Let's try a heuristic:
        //    For every waypoint edge `Source -> Waypoint` or `Waypoint -> Target`, 
        //    we don't need to remove anything yet.
        //    But we need to remove the direct edge `Source -> Target`.

        //    Let's build a map of "Routed Connections": Source -> Target
        //    Traverse from every Source that connects to a Waypoint.
        //    Follow the path until we hit a non-waypoint node.
        //    That is the Target.
        //    Then remove the direct edge Source -> Target.

        const routedConnections = [];

        const findTarget = (currentId, visited = new Set()) => {
            if (visited.has(currentId)) return null;
            visited.add(currentId);

            // Find outgoing edges from this node
            // We need to look in `savedPositions.waypointEdges`
            const outgoing = savedPositions.waypointEdges.filter(e => e.source === currentId);

            for (const edge of outgoing) {
                if (edge.target.startsWith('waypoint-')) {
                    return findTarget(edge.target, visited);
                } else {
                    return edge.target;
                }
            }
            return null;
        };

        // Find all sources that connect to a waypoint
        const waypointSources = new Set();
        savedPositions.waypointEdges.forEach(e => {
            if (!e.source.startsWith('waypoint-')) {
                waypointSources.add(e.source);
            }
        });

        waypointSources.forEach(sourceId => {
            const targetId = findTarget(sourceId); // This finds the target via waypoints (using saved edges)
            // Wait, findTarget needs to start traversing from the waypoint connected to sourceId.
            // The `findTarget` above starts at `currentId`.
            // If `currentId` is `sourceId`, it finds edge to Waypoint, then recurses.
            // Yes, that works.

            if (targetId) {
                routedConnections.push({ source: sourceId, target: targetId });
            }
        });

        // Remove direct edges that match routed connections
        routedConnections.forEach(({ source, target }) => {
            const edgeIndex = edges.findIndex(e => e.source === source && e.target === target);
            if (edgeIndex !== -1) {
                edges.splice(edgeIndex, 1);
            }
        });
    }

    return { nodes, edges };
};

const getOptionText = (opt) => {
    if (!opt) return '';
    if (typeof opt === 'string') return opt;
    if (opt['#text']) return opt['#text'];
    const entries = Object.entries(opt);
    const textEntry = entries.find(([key]) => !key.startsWith('@_'));
    return textEntry ? textEntry[1] : '';
};

export const parseXMLToFlow = (xmlString) => {
    const jsonObj = parser.parse(xmlString);
    const questions = jsonObj.questions.question;
    const dependencies = jsonObj.questions.dependencies;

    const nodes = [];
    const edges = [];

    // Process Questions
    const qArray = Array.isArray(questions) ? questions : [questions];
    qArray.forEach((q) => {
        const qId = `q${q['@_id']}`;

        let tooltipText = null;
        if (q.tooltip) {
            tooltipText = typeof q.tooltip === 'string' ? q.tooltip : q.tooltip['#text'] || q.tooltip;
        }

        nodes.push({
            id: qId,
            type: 'questionNode',
            data: {
                label: q.text,
                questionId: q['@_id'],
                tooltip: tooltipText
            },
            position: { x: 0, y: 0 }
        });

        // Create option nodes for each option
        if (q.options && q.options.option) {
            const opts = Array.isArray(q.options.option) ? q.options.option : [q.options.option];
            opts.forEach((opt) => {
                const optId = `${qId}-opt${opt['@_id']}`;
                const optText = getOptionText(opt);

                nodes.push({
                    id: optId,
                    type: 'optionNode',
                    data: {
                        label: optText,
                        questionId: q['@_id'],
                        optionId: opt['@_id']
                    },
                    position: { x: 0, y: 0 }
                });

                // Q→O edges: Thin, solid, not animated
                edges.push({
                    id: `${qId}-to-${optId}`,
                    source: qId,
                    target: optId,
                    targetHandle: 'top',
                    type: 'q-to-o',
                    animated: false,
                    style: { stroke: '#9ca3af', strokeWidth: 1 }
                });
            });
        }

        // Process Next Questions
        if (q.nextQuestions && q.nextQuestions.next) {
            const nexts = Array.isArray(q.nextQuestions.next) ? q.nextQuestions.next : [q.nextQuestions.next];
            nexts.forEach((next) => {
                if (next['@_questionId']) {
                    const targetId = `q${next['@_questionId']}`;
                    const optionId = next['@_optionId'];

                    if (optionId) {
                        // O→Q edges: Bold, dashed, not animated
                        const sourceOptId = `${qId}-opt${optionId}`;
                        edges.push({
                            id: `${sourceOptId}-to-${targetId}`,
                            source: sourceOptId,
                            target: targetId,
                            sourceHandle: 'bottom',
                            type: 'o-to-q',
                            animated: false,
                            style: { stroke: '#333', strokeWidth: 2, strokeDasharray: '5,5' }
                        });
                    } else {
                        // Default connection
                        if (q.options && q.options.option) {
                            const opts = Array.isArray(q.options.option) ? q.options.option : [q.options.option];
                            opts.forEach((opt) => {
                                const hasSpecificNext = nexts.some(n => n['@_optionId'] == opt['@_id']);
                                if (!hasSpecificNext) {
                                    const sourceOptId = `${qId}-opt${opt['@_id']}`;
                                    edges.push({
                                        id: `${sourceOptId}-to-${targetId}-default`,
                                        source: sourceOptId,
                                        target: targetId,
                                        sourceHandle: 'bottom',
                                        type: 'o-to-q',
                                        animated: false,
                                        style: { stroke: '#333', strokeWidth: 2, strokeDasharray: '5,5' }
                                    });
                                }
                            });
                        }
                    }
                }
            });
        }
    });

    // Process Documents
    if (dependencies && dependencies.document) {
        const docArray = Array.isArray(dependencies.document) ? dependencies.document : [dependencies.document];
        docArray.forEach((d, index) => {
            const docId = `doc${index}`;
            nodes.push({
                id: docId,
                type: 'documentNode',
                data: {
                    label: d.text,
                    docType: d['@_type'],
                    description: d.description || null
                },
                position: { x: 0, y: 0 }
            });

            // O→D edges: Bold, dashed, not animated
            if (d.conditions && d.conditions.condition) {
                const conds = Array.isArray(d.conditions.condition) ? d.conditions.condition : [d.conditions.condition];
                conds.forEach((cond) => {
                    const questionId = cond['@_questionId'];
                    const optionId = cond['@_optionId'];
                    const sourceOptId = `q${questionId}-opt${optionId}`;

                    edges.push({
                        id: `${sourceOptId}-to-${docId}`,
                        source: sourceOptId,
                        target: docId,
                        sourceHandle: 'left',
                        type: 'o-to-d',
                        animated: false,
                        style: { stroke: '#007bff', strokeWidth: 2, strokeDasharray: '5,5' }
                    });
                });
            }
        });
    }

    return getLayoutedElements(nodes, edges);
};
