import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionService } from '../../src/services/xmlParser';

describe('QuestionService Unit Test', () => {
    let service;

    beforeEach(() => {
        service = new QuestionService();
        vi.stubGlobal('fetch', vi.fn());
    });

    it('should parse questions correctly from XML', async () => {
        const mockXml = `
            <questions>
                <question id="1">
                    <text>What is your name?</text>
                    <options>
                        <option id="a">
                            <text>Alice</text>
                        </option>
                    </options>
                </question>
            </questions>
        `;

        fetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockXml),
        });

        const questions = await service.fetchQuestions();
        expect(questions.size).toBe(1);
        expect(questions.get('1').text).toBe('What is your name?');
    });
});
