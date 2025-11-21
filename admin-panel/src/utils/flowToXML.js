// Flow to XML Converter - Converts React Flow nodes/edges back to XML

/**
 * Convert React Flow nodes and edges to questions.xml format
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @returns {string} XML string
 */
export const flowToXML = (nodes, edges) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<questions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
    xml += '           xsi:noNamespaceSchemaLocation="questions.xsd">\n\n';

    // Separate nodes by type
    const questionNodes = nodes.filter(n => n.type === 'questionNode');
    const documentNodes = nodes.filter(n => n.type === 'documentNode');

    // Sort questions by ID
    const sortedQuestions = questionNodes.sort((a, b) => {
        const aId = parseInt(a.id.replace('q', ''));
        const bId = parseInt(b.id.replace('q', ''));
        return aId - bId;
    });

    // Generate question elements
    sortedQuestions.forEach(qNode => {
        const qId = qNode.id.replace('q', '');
        xml += `  <question id="${qId}">\n`;
        xml += `    <text>${escapeXml(qNode.data.label)}</text>\n`;

        // Add tooltip if present
        if (qNode.data.tooltip) {
            xml += `    <tooltip>\n      ${escapeXml(qNode.data.tooltip)}\n    </tooltip>\n`;
        }

        // Find option nodes for this question
        const optionNodes = nodes.filter(n =>
            n.type === 'optionNode' && n.id.startsWith(`${qNode.id}-opt`)
        );

        if (optionNodes.length > 0) {
            xml += `    <options>\n`;

            // Sort options by ID
            const sortedOptions = optionNodes.sort((a, b) => {
                const aId = parseInt(a.id.split('-opt')[1]);
                const bId = parseInt(b.id.split('-opt')[1]);
                return aId - bId;
            });

            sortedOptions.forEach(optNode => {
                const optId = optNode.id.split('-opt')[1];
                xml += `      <option id="${optId}">${escapeXml(optNode.data.label)}</option>\n`;
            });

            xml += `    </options>\n`;

            // Find next question connections from options
            const nextQuestions = [];
            sortedOptions.forEach(optNode => {
                const outgoingEdges = edges.filter(e =>
                    e.source === optNode.id && e.type === 'o-to-q'
                );

                outgoingEdges.forEach(edge => {
                    const targetQId = edge.target.replace('q', '');
                    const optId = optNode.id.split('-opt')[1];
                    nextQuestions.push({ optionId: optId, questionId: targetQId });
                });
            });

            if (nextQuestions.length > 0) {
                xml += `    <nextQuestions>\n`;
                nextQuestions.forEach(nq => {
                    xml += `      <next optionId="${nq.optionId}" questionId="${nq.questionId}"/>\n`;
                });
                xml += `    </nextQuestions>\n`;
            }
        }

        xml += `  </question>\n\n`;
    });

    // Generate dependencies section
    if (documentNodes.length > 0) {
        xml += `  <dependencies>\n`;

        // Documents
        documentNodes.forEach(docNode => {
            const docType = docNode.data.docType || 'optional';
            xml += `    <document type="${docType}">\n`;
            xml += `      <text>${escapeXml(docNode.data.label)}</text>\n`;

            // Add description if present
            if (docNode.data.description) {
                xml += `      <description>${escapeXml(docNode.data.description)}</description>\n`;
            }

            // Find conditions (edges pointing to this document)
            const incomingEdges = edges.filter(e =>
                e.target === docNode.id && e.type === 'o-to-d'
            );

            if (incomingEdges.length > 0) {
                xml += `      <conditions>\n`;
                incomingEdges.forEach(edge => {
                    // Parse source: "q1-opt2" -> questionId=1, optionId=2
                    const match = edge.source.match(/q(\d+)-opt(\d+)/);
                    if (match) {
                        const questionId = match[1];
                        const optionId = match[2];
                        xml += `        <condition questionId="${questionId}" optionId="${optionId}"/>\n`;
                    }
                });
                xml += `      </conditions>\n`;
            }

            xml += `    </document>\n\n`;
        });

        xml += `  </dependencies>\n\n`;
    }

    xml += '</questions>\n';

    return xml;
};

/**
 * Escape special XML characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeXml = (text) => {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

/**
 * Download XML as file
 * @param {string} xml - XML content
 * @param {string} filename - Filename (default: questions.xml)
 */
export const downloadXML = (xml, filename = 'questions.xml') => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
