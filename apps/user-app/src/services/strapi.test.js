import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrapiService } from './strapi';

describe('StrapiService', () => {
    let service;

    beforeEach(() => {
        service = new StrapiService();
    });

    describe('richTextToHtml', () => {
        it('should convert paragraphs and basic formatting', () => {
            const blocks = [
                {
                    type: 'paragraph',
                    children: [
                        { text: 'Hello ' },
                        { text: 'world', bold: true },
                        { text: '!' }
                    ]
                }
            ];
            const html = service.richTextToHtml(blocks);
            expect(html).toBe('<p>Hello <strong>world</strong>!</p>');
        });

        it('should convert headings', () => {
            const blocks = [
                {
                    type: 'heading',
                    level: 1,
                    children: [{ text: 'Title' }]
                }
            ];
            const html = service.richTextToHtml(blocks);
            expect(html).toBe('<h1>Title</h1>');
        });

        it('should convert lists', () => {
            const blocks = [
                {
                    type: 'list',
                    format: 'unordered',
                    children: [
                        {
                            type: 'list-item',
                            children: [{ text: 'Item 1' }]
                        },
                        {
                            type: 'list-item',
                            children: [{ text: 'Item 2' }]
                        }
                    ]
                }
            ];
            const html = service.richTextToHtml(blocks);
            expect(html).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
        });

        it('should handle complex formatting (italic, underline, strikethrough)', () => {
            const blocks = [
                {
                    type: 'paragraph',
                    children: [
                        { text: 'italics', italic: true },
                        { text: ' ' },
                        { text: 'underline', underline: true },
                        { text: ' ' },
                        { text: 'strike', strikethrough: true }
                    ]
                }
            ];
            const html = service.richTextToHtml(blocks);
            expect(html).toBe('<p><em>italics</em> <u>underline</u> <s>strike</s></p>');
        });

        it('should return empty string for null/undefined input', () => {
            expect(service.richTextToHtml(null)).toBe('');
            expect(service.richTextToHtml(undefined)).toBe('');
            expect(service.richTextToHtml([])).toBe('');
        });
    });
});
