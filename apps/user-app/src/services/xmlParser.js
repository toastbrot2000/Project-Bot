import { XMLParser } from 'fast-xml-parser';

export class QuestionService {
    constructor() {
        this.questions = new Map();
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
            textNodeName: 'text',
        });
        this.dependencies = [];
    }

    getDependencies() {
        return this.dependencies;
    }

    async fetchQuestions() {
        try {
            const response = await fetch(`/questions.xml?v=${Date.now()}`);
            if (!response.ok) throw new Error('Failed to load questions.xml');

            const xmlText = await response.text();
            const jsonObj = this.parser.parse(xmlText);

            if (!jsonObj.questions || !jsonObj.questions.question) {
                throw new Error('Invalid XML structure');
            }

            // fast-xml-parser might return a single object if there's only one question,
            // or an array. We normalize to array.
            const questionList = Array.isArray(jsonObj.questions.question)
                ? jsonObj.questions.question
                : [jsonObj.questions.question];

            questionList.forEach(q => {
                // Normalize text content helper
                const getText = (val) => {
                    if (!val) return '';
                    if (Array.isArray(val)) val = val[0];
                    if (typeof val === 'object') return val.text || val['#text'] || '';
                    return val;
                };

                q.text = getText(q.text);

                // Normalize options
                if (q.options && q.options.option) {
                    if (!Array.isArray(q.options.option)) {
                        q.options.option = [q.options.option];
                    }
                    q.options.option.forEach(opt => {
                        opt.text = getText(opt.text || opt['#text']);
                    });
                }

                // Normalize nextQuestions
                if (q.nextQuestions && q.nextQuestions.next) {
                    if (!Array.isArray(q.nextQuestions.next)) {
                        q.nextQuestions.next = [q.nextQuestions.next];
                    }
                }

                this.questions.set(q.id, q);
            });

            // Parse Dependencies
            if (jsonObj.questions.dependencies && jsonObj.questions.dependencies.document) {
                const deps = Array.isArray(jsonObj.questions.dependencies.document)
                    ? jsonObj.questions.dependencies.document
                    : [jsonObj.questions.dependencies.document];

                this.dependencies = deps.map(doc => {
                    // Normalize text
                    const getText = (val) => {
                        if (!val) return '';
                        if (Array.isArray(val)) val = val[0];
                        if (typeof val === 'object') return val.text || val['#text'] || '';
                        return val;
                    };
                    doc.text = getText(doc.text);

                    // Normalize conditions
                    if (doc.conditions && doc.conditions.condition) {
                        if (!Array.isArray(doc.conditions.condition)) {
                            doc.conditions.condition = [doc.conditions.condition];
                        }
                    } else {
                        // Ensure it is an array even if empty/missing
                        if (!doc.conditions) doc.conditions = { condition: [] };
                    }
                    return doc;
                });
            } else {
                this.dependencies = [];
            }

            return this.questions;
        } catch (error) {
            console.error('Error fetching questions:', error);
            throw error;
        }
    }

    getQuestionById(id) {
        return this.questions.get(id);
    }
}

export const questionService = new QuestionService();
