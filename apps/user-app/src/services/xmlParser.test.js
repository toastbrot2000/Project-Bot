import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionService } from './xmlParser';

describe('QuestionService', () => {
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
                        <option id="b">
                            <text>Bob</text>
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
        const q1 = questions.get('1');
        expect(q1.text).toBe('What is your name?');
        expect(q1.options.option).toHaveLength(2);
        expect(q1.options.option[0].text).toBe('Alice');
    });

    it('should handle single question (not array) correctly', async () => {
        const mockXml = `
            <questions>
                <question id="1">
                    <text>Single question?</text>
                </question>
            </questions>
        `;

        fetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockXml),
        });

        const questions = await service.fetchQuestions();
        expect(questions.size).toBe(1);
        expect(Array.isArray(questions.get('1').options?.option)).toBe(false); // It doesn't auto-array if missing
    });

    it('should parse dependencies correctly', async () => {
        const mockXml = `
            <questions>
                <question id="1"><text>Q1</text></question>
                <dependencies>
                    <document title="Doc1">
                        <text>Content 1</text>
                        <conditions>
                            <condition qid="1" value="yes" />
                        </conditions>
                    </document>
                </dependencies>
            </questions>
        `;

        fetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockXml),
        });

        await service.fetchQuestions();
        const deps = service.getDependencies();
        expect(deps).toHaveLength(1);
        expect(deps[0].title).toBe('Doc1');
        expect(deps[0].conditions.condition).toHaveLength(1);
    });

    it('should throw error on invalid XML structure', async () => {
        const mockXml = `<invalid></invalid>`;

        fetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockXml),
        });

        await expect(service.fetchQuestions()).rejects.toThrow('Invalid XML structure');
    });
});
