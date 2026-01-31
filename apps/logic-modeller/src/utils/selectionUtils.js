/**
 * Checks if a box intersects with a line segment.
 * @param {Object} box - { x, y, width, height }
 * @param {Object} p1 - { x, y }
 * @param {Object} p2 - { x, y }
 * @returns {boolean}
 */
export const isSegmentInBox = (box, p1, p2) => {
    const { x: bx, y: by, width: bw, height: bh } = box;
    const xMin = Math.min(p1.x, p2.x);
    const xMax = Math.max(p1.x, p2.x);
    const yMin = Math.min(p1.y, p2.y);
    const yMax = Math.max(p1.y, p2.y);

    // Quick AABB check
    if (xMax < bx || xMin > bx + bw || yMax < by || yMin > by + bh) {
        return false;
    }

    // Since we only need to know if ANY part of the edge is in the box, 
    // and we are doing "partial" selection, if the segment's AABB overlaps 
    // with the selection box, it's a good candidate.
    // For a more precise check (Line-Rectangle intersection), we'd check if either endpoint is inside
    // or if the segment intersects any of the 4 box edges.
    
    const isPointInBox = (p) => p.x >= bx && p.x <= bx + bw && p.y >= by && p.y <= by + bh;
    
    if (isPointInBox(p1) || isPointInBox(p2)) return true;

    // Check intersection with box edges
    const intersect = (p, p2, q, q2) => {
        const r = { x: p2.x - p.x, y: p2.y - p.y };
        const s = { x: q2.x - q.x, y: q2.y - q.y };
        const rxs = r.x * s.y - r.y * s.x;
        const q_minus_p = { x: q.x - p.x, y: q.y - p.y };

        if (rxs === 0) return false; // Parallel

        const t = (q_minus_p.x * s.y - q_minus_p.y * s.x) / rxs;
        const u = (q_minus_p.x * r.y - q_minus_p.y * r.x) / rxs;

        return (t >= 0 && t <= 1) && (u >= 0 && u <= 1);
    };

    const boxNodes = [
        { x: bx, y: by },
        { x: bx + bw, y: by },
        { x: bx + bw, y: by + bh },
        { x: bx, y: by + bh }
    ];

    for (let i = 0; i < 4; i++) {
        if (intersect(p1, p2, boxNodes[i], boxNodes[(i + 1) % 4])) return true;
    }

    return false;
};

/**
 * Calculates Catmull-Rom points to approximate the curve for selection.
 */
export const getCatmullRomPoints = (points, segmentsPerCurve = 10) => {
    if (points.length < 2) return points;
    
    const p = [points[0], ...points, points[points.length - 1]];
    const sampledPoints = [];

    for (let i = 1; i < p.length - 2; i++) {
        const p0 = p[i - 1];
        const p1 = p[i];
        const p2 = p[i + 1];
        const p3 = p[i + 2];

        for (let t = 0; t <= 1; t += 1 / segmentsPerCurve) {
            const t2 = t * t;
            const t3 = t2 * t;

            const x = 0.5 * (
                (2 * p1.x) +
                (-p0.x + p2.x) * t +
                (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
            );
            const y = 0.5 * (
                (2 * p1.y) +
                (-p0.y + p2.y) * t +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
            );
            sampledPoints.push({ x, y });
        }
    }
    return sampledPoints;
};

/**
 * Checks if an edge intersects with a selection box.
 */
export const isEdgeInBox = (box, edge, nodes) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return false;

    // Use node positions (center or handle positions would be better but this is a good start)
    // Actually, React Flow uses handle positions. Let's approximate with node centers or handle locations if possible.
    // For now, let's use the absolute positions provided in the edge if we were in a custom component, 
    // but here we are in the parent.
    
    const sourcePos = { 
        x: sourceNode.position.x + (sourceNode.width || 0) / 2, 
        y: sourceNode.position.y + (sourceNode.height || 0) / 2 
    };
    const targetPos = { 
        x: targetNode.position.x + (targetNode.width || 0) / 2, 
        y: targetNode.position.y + (targetNode.height || 0) / 2 
    };

    let waypoints = [];
    if (edge.data?.waypoints) waypoints = edge.data.waypoints;
    else if (edge.data?.waypoint) waypoints = [edge.data.waypoint];

    const allPoints = [sourcePos, ...waypoints, targetPos];

    if (edge.type === 'curved' || waypoints.length > 0) {
        const sampledPoints = getCatmullRomPoints(allPoints);
        for (let i = 0; i < sampledPoints.length - 1; i++) {
            if (isSegmentInBox(box, sampledPoints[i], sampledPoints[i + 1])) return true;
        }
    } else {
        // Simple line or Bezier (approximated as line for selection for now, or could sample Bezier)
        // For Bezier, we should ideally sample a few points.
        if (isSegmentInBox(box, sourcePos, targetPos)) return true;
    }

    return false;
};

/**
 * Updates edges based on the selection box.
 * @param {Array} edges 
 * @param {Array} nodes 
 * @param {Object} selectionBox 
 * @param {boolean} globalAnimate
 * @param {boolean} isShiftHeld
 * @returns {Array}
 */
export const getUpdatedEdges = (edges, nodes, selectionBox, globalAnimate = false, isShiftHeld = false) => {
    return edges.map(edge => {
        const isSelectedInBox = isEdgeInBox(selectionBox, edge, nodes);
        
        let selected = edge.selected;
        if (isShiftHeld) {
            if (isSelectedInBox) selected = true;
            // If it was already selected, it stays selected.
        } else {
            selected = isSelectedInBox;
        }

        const animated = selected || globalAnimate;
        
        return { ...edge, selected, animated };
    });
};
