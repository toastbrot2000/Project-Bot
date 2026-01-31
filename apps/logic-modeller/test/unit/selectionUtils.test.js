import { describe, it, expect } from 'vitest';
import { isSegmentInBox, getCatmullRomPoints, isEdgeInBox, getUpdatedEdges } from '../../src/utils/selectionUtils';

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

    describe('getUpdatedEdges', () => {
        const nodes = [
            { id: '1', position: { x: 0, y: 0 }, width: 10, height: 10 },
            { id: '2', position: { x: 100, y: 100 }, width: 10, height: 10 }
        ];
        const edges = [
            { id: 'e1', source: '1', target: '2', selected: false, animated: false }
        ];
        const box = { x: 40, y: 40, width: 20, height: 20 };

        it('should set selected and animated to true when edge is in box', () => {
            const updated = getUpdatedEdges(edges, nodes, box, false);
            expect(updated[0].selected).toBe(true);
            expect(updated[0].animated).toBe(true);
        });

        it('should deselect and stop animation if not in box and globalAnimate is false', () => {
            const selectedEdges = [{ ...edges[0], selected: true, animated: true }];
            const outsideBox = { x: -50, y: -50, width: 10, height: 10 };
            const updated = getUpdatedEdges(selectedEdges, nodes, outsideBox, false);
            expect(updated[0].selected).toBe(false);
            expect(updated[0].animated).toBe(false);
        });

        it('should stay animated even if deselected if globalAnimate is true', () => {
            const selectedEdges = [{ ...edges[0], selected: true, animated: true }];
            const outsideBox = { x: -50, y: -50, width: 10, height: 10 };
            const updated = getUpdatedEdges(selectedEdges, nodes, outsideBox, true);
            expect(updated[0].selected).toBe(false);
            expect(updated[0].animated).toBe(true);
        });

        it('should maintain selection if shift is held and already selected', () => {
            const selectedEdges = [{ ...edges[0], selected: true, animated: true }];
            const outsideBox = { x: -50, y: -50, width: 10, height: 10 };
            const updated = getUpdatedEdges(selectedEdges, nodes, outsideBox, false, true);
            expect(updated[0].selected).toBe(true);
            expect(updated[0].animated).toBe(true);
        });

        it('should correctly handle live updates where an edge enters and then leaves the box during a drag', () => {
            const initialEdges = [{ id: 'e1', source: '1', target: '2', selected: false, animated: false }];
            
            // Step 1: Edge enters box
            const box1 = { x: 40, y: 40, width: 20, height: 20 };
            const step1 = getUpdatedEdges(initialEdges, nodes, box1, false, false);
            expect(step1[0].selected).toBe(true);
            expect(step1[0].animated).toBe(true);

            // Step 2: Edge leaves box (still dragging, box moved away)
            const box2 = { x: -50, y: -50, width: 10, height: 10 };
            const step2 = getUpdatedEdges(step1, nodes, box2, false, false);
            expect(step2[0].selected).toBe(false);
            expect(step2[0].animated).toBe(false);
            
            // Step 3: Global animation turned on during drag
            const step3 = getUpdatedEdges(step2, nodes, box2, true, false);
            expect(step3[0].selected).toBe(false);
            expect(step3[0].animated).toBe(true);
        });
    });
});
