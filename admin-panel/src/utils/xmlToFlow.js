import { XMLParser } from 'fast-xml-parser';
import dagre from 'dagre';
import { MarkerType } from 'reactflow';
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

    // Apply saved edge data (waypoints)
    if (savedPositions.edgeData) {
        edges.forEach(edge => {
            if (savedPositions.edgeData[edge.id]) {
                const savedData = savedPositions.edgeData[edge.id];
                edge.type = savedData.type || 'curved';

                let waypoints = [];
                if (savedData.waypoints) {
                    waypoints = savedData.waypoints;
                } else if (savedData.waypoint) {
                    waypoints = [savedData.waypoint];
                }

                edge.data = {
                    ...edge.data,
                    waypoints
                };
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
                    markerEnd: { type: MarkerType.ArrowClosed },
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
                            markerEnd: { type: MarkerType.ArrowClosed },
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
                                        markerEnd: { type: MarkerType.ArrowClosed },
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
                        markerEnd: { type: MarkerType.ArrowClosed },
                        style: { stroke: '#007bff', strokeWidth: 2, strokeDasharray: '5,5' }
                    });
                });
            }
        });
    }

    return getLayoutedElements(nodes, edges);
};
