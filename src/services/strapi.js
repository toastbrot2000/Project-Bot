
// Constants
const STRAPI_URL = "http://localhost:1337/api";

export class StrapiService {
    constructor() {
        this.tooltips = new Map();
        this.documents = new Map();
    }

    async fetchTooltips() {
        try {
            const response = await fetch(`${STRAPI_URL}/tooltips`);
            if (!response.ok) throw new Error('Failed to fetch tooltips');

            const data = await response.json();
            data.data.forEach(item => {
                // API response is flat in recent Strapi versions or depends on populate
                if (item.question_id && item.content) {
                    this.tooltips.set(item.question_id, item.content);
                } else if (item.attributes) { // Fallback for older Strapi structure
                    if (item.attributes.question_id && item.attributes.content) {
                        this.tooltips.set(item.attributes.question_id, item.attributes.content);
                    }
                }
            });
            console.log("✅ Strapi tooltips loaded:", this.tooltips);
        } catch (error) {
            console.error("❌ Error fetching tooltips from Strapi:", error);
        }
    }

    async fetchDocuments() {
        try {
            const response = await fetch(`${STRAPI_URL}/visa-documents?populate=*`);
            if (!response.ok) throw new Error('Failed to fetch documents');

            const data = await response.json();
            data.data.forEach(item => {
                if (item.title && item.description) {
                    this.documents.set(item.title, item.description);
                } else if (item.attributes) {
                    if (item.attributes.title && item.attributes.description) {
                        this.documents.set(item.attributes.title, item.attributes.description);
                    }
                }
            });
            console.log("✅ Strapi documents loaded:", this.documents);
        } catch (error) {
            console.error("❌ Error fetching documents from Strapi:", error);
        }
    }

    getTooltip(questionId) {
        return this.tooltips.get(questionId);
    }

    getDocument(title) {
        return this.documents.get(title);
    }

    // Helper to convert Rich Text (Blocks) to HTML
    richTextToHtml(blocks) {
        if (!blocks || !Array.isArray(blocks)) return '';

        const renderNode = (node) => {
            let text = node.text ? node.text.replace(/\n/g, '<br>') : '';
            if (node.bold) text = `<strong>${text}</strong>`;
            if (node.italic) text = `<em>${text}</em>`;
            if (node.underline) text = `<u>${text}</u>`;
            if (node.strikethrough) text = `<s>${text}</s>`;
            return text;
        };

        let html = '';
        blocks.forEach(block => {
            switch (block.type) {
                case 'paragraph':
                    html += `<p>${block.children ? block.children.map(renderNode).join('') : ''}</p>`;
                    break;
                case 'heading':
                    html += `<h${block.level}>${block.children ? block.children.map(renderNode).join('') : ''}</h${block.level}>`;
                    break;
                case 'list':
                    const tag = block.format === 'ordered' ? 'ol' : 'ul';
                    html += `<${tag}>`;
                    if (block.children) {
                        block.children.forEach(listItem => {
                            const buildListItem = (item) => {
                                let content = '';
                                if (item.children) {
                                    content += item.children.map(childNode => {
                                        if (childNode.type === 'list') { // Nested list
                                            return this.richTextToHtml([childNode]);
                                        }
                                        return renderNode(childNode);
                                    }).join('');
                                }
                                return `<li>${content}</li>`;
                            };
                            html += buildListItem(listItem);
                        });
                    }
                    html += `</${tag}>`;
                    break;
                default:
                    break;
            }
        });
        return html;
    }
}

export const strapiService = new StrapiService();
