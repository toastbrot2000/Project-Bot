import { XMLParser } from 'fast-xml-parser';

export class QuestionService {
    constructor() {
        this.questions = new Map();
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
            textNodeName: 'text',
        });
    }

    async fetchQuestions() {
        try {
            const response = await fetch('/questions.xml');
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
