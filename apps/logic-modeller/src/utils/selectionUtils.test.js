import { describe, it, expect } from 'vitest';
import { isSegmentInBox, getCatmullRomPoints, isEdgeInBox } from './selectionUtils';

describe('selectionUtils', () => {
    describe('isSegmentInBox', () => {
        const box = { x: 10, y: 10, width: 20, height: 20 };

        it('should return true if segment is entirely inside', () => {
            expect(isSegmentInBox(box, { x: 15, y: 15 }, { x: 25, y: 25 })).toBe(true);
        });

        it('should return true if segment crosses the box', () => {
            expect(isSegmentInBox(box, { x: 5, y: 5 }, { x: 35, y: 35 })).toBe(true);
        });

        it('should return false if segment is entirely outside', () => {
            expect(isSegmentInBox(box, { x: 0, y: 0 }, { x: 5, y: 5 })).toBe(false);
        });

        it('should return true if only one point is inside', () => {
             expect(isSegmentInBox(box, { x: 15, y: 15 }, { x: 50, y: 50 })).toBe(true);
        });
    });

    describe('getCatmullRomPoints', () => {
        it('should sample points', () => {
            const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];
            const sampled = getCatmullRomPoints(points, 2);
            expect(sampled.length).toBeGreaterThan(points.length);
        });
    });

    describe('isEdgeInBox', () => {
        const nodes = [
            { id: '1', position: { x: 0, y: 0 }, width: 10, height: 10 },
            { id: '2', position: { x: 100, y: 100 }, width: 10, height: 10 }
        ];

        it('should return true if a simple edge crosses the box', () => {
            const edge = { source: '1', target: '2' };
            const box = { x: 40, y: 40, width: 20, height: 20 };
            expect(isEdgeInBox(box, edge, nodes)).toBe(true);
        });

        it('should return true if a curved edge with waypoints crosses the box', () => {
            const edge = { 
                source: '1', 
                target: '2', 
                type: 'curved', 
                data: { waypoints: [{ x: 50, y: 0 }] } 
            };
            const box = { x: 45, y: -5, width: 10, height: 10 };
            expect(isEdgeInBox(box, edge, nodes)).toBe(true);
        });

        it('should return false if edge is outside', () => {
            const edge = { source: '1', target: '2' };
            const box = { x: -50, y: -50, width: 10, height: 10 };
            expect(isEdgeInBox(box, edge, nodes)).toBe(false);
        });
    });
});
