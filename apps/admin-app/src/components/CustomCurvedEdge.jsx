import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';

// Helper to calculate distance between two points
const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Catmull-Rom spline to SVG path
const getCatmullRomPath = (points) => {
    if (points.length < 2) return "";

    // Duplicate first and last points to make the spline pass through them
    const p = [points[0], ...points, points[points.length - 1]];

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < p.length - 2; i++) {
        const p0 = p[i - 1];
        const p1 = p[i];
        const p2 = p[i + 1];
        const p3 = p[i + 2];

        // Catmull-Rom to Cubic Bezier conversion matrix
        // Constraint: Tension = 0.5 (standard Catmull-Rom)

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;

        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
    }

    return path;
};

export default function CustomCurvedEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected
}) {
    const [draggingIndex, setDraggingIndex] = useState(null);

    // Normalize waypoints data
    let waypoints = [];
    if (data) {
        if (data.waypoints && Array.isArray(data.waypoints)) {
            waypoints = data.waypoints;
        } else if (data.waypoint) {
            // Legacy support
            waypoints = [data.waypoint];
        }
    }

    // If no waypoints, behave like a normal Bezier edge
    if (waypoints.length === 0) {
        const [edgePath] = getBezierPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
        });
        return (
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
        );
    }

    // Construct path through all points
    const allPoints = [
        { x: sourceX, y: sourceY },
        ...waypoints,
        { x: targetX, y: targetY }
    ];

    // Use Catmull-Rom for smooth curve through points
    // If only 1 waypoint, we can stick to the quadratic bezier for simplicity/performance, 
    // but Catmull-Rom is more general. Let's use Catmull-Rom for consistency if > 0 waypoints.
    // Actually, for 1 waypoint, Catmull-Rom might look slightly different than Quadratic.
    // Let's use Catmull-Rom for everything to allow smooth transitions when adding points.

    const path = getCatmullRomPath(allPoints);

    // Selection style override
    const edgeStyle = selected ? { ...style, stroke: '#f59e0b', strokeWidth: (style.strokeWidth || 2) + 1 } : style;

    // Handle waypoint drag
    const handleMouseDown = (e, index) => {
        e.stopPropagation();
        setDraggingIndex(index);

        if (data.onWaypointDragStart) {
            data.onWaypointDragStart(id, index);
        }

        const handleMouseMove = (moveEvent) => {
            if (data.onWaypointDrag) {
                // Calculate flow position from screen coordinates
                const { clientX, clientY } = moveEvent;
                data.onWaypointDrag(id, index, { x: clientX, y: clientY });
            }
        };

        const handleMouseUp = () => {
            setDraggingIndex(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (data.onWaypointDragStop) {
                data.onWaypointDragStop(id, index);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <>
            <BaseEdge path={path} markerEnd={markerEnd} style={edgeStyle} />
            {selected && (
                <EdgeLabelRenderer>
                    {waypoints.map((wp, index) => {
                        const isSelected = data.selectedWaypointIndex === index;
                        return (
                            <div
                                key={index}
                                style={{
                                    position: 'absolute',
                                    transform: `translate(-50%, -50%) translate(${wp.x}px, ${wp.y}px)`,
                                    pointerEvents: 'all',
                                    cursor: draggingIndex === index ? 'grabbing' : 'grab',
                                    zIndex: isSelected ? 1001 : 1000, // Bring selected to front
                                }}
                                onMouseDown={(e) => handleMouseDown(e, index)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (data.onWaypointClick) {
                                        data.onWaypointClick(id, index);
                                    }
                                }}
                            >
                                <div
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: draggingIndex === index ? '#f59e0b' : (isSelected ? '#ef4444' : '#3b82f6'),
                                        border: isSelected ? '2px solid #fff' : '2px solid white',
                                        boxShadow: isSelected ? '0 0 0 2px #ef4444, 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.3)',
                                        transition: 'all 0.2s ease',
                                        transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                                    }}
                                />
                            </div>
                        );
                    })}
                </EdgeLabelRenderer>
            )}
        </>
    );
}
