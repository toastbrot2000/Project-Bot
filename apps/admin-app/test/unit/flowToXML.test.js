import { describe, it, expect } from 'vitest';
import { flowToXML } from '../../src/utils/flowToXML';

describe('flowToXML', () => {
    it('should generate valid XML for a single question node', () => {
        const nodes = [
            {
                id: 'q1',
                type: 'questionNode',
                data: { label: 'What is your name?' }
            }
        ];
        const edges = [];

        const xml = flowToXML(nodes, edges);

        expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(xml).toContain('<question id="1">');
        expect(xml).toContain('<text>What is your name?</text>');
    });

    it('should handle end nodes', () => {
        const nodes = [
             {
                id: 'end1',
                type: 'endNode',
                data: { label: 'Goodbye' }
            }
        ];
        const edges = [];

        const xml = flowToXML(nodes, edges);

        expect(xml).toContain('<endNodes>');
        expect(xml).toContain('<endNode id="1">');
        expect(xml).toContain('<text>Goodbye</text>');
    });
});
