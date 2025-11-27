// Position Manager - Handles saving and loading node positions

const STORAGE_KEY = 'flowModeler_nodePositions';

/**
 * Save node positions and waypoints to localStorage
 * @param {Array} nodes - React Flow nodes array
 * @param {Set} manuallyMovedNodes - Set of node IDs that were manually moved
 * @param {Array} edges - React Flow edges array (needed for waypoints)
 */
export const savePositions = (nodes, manuallyMovedNodes, edges) => {
    const data = {
        positions: {},
        edgeData: {}
    };

    // Save positions for manually moved nodes
    nodes.forEach(node => {
        if (manuallyMovedNodes.has(node.id)) {
            data.positions[node.id] = {
                x: node.position.x,
                y: node.position.y,
                manual: true
            };
        }
    });

    // Save edge data (waypoints)
    if (edges) {
        edges.forEach(edge => {
            if (edge.data && (edge.data.waypoints || edge.data.waypoint)) {
                data.edgeData[edge.id] = {
                    waypoints: edge.data.waypoints || [edge.data.waypoint],
                    type: edge.type
                };
            }
        });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return Object.keys(data.positions).length + Object.keys(data.edgeData).length;
};

/**
 * Load saved positions and waypoints from localStorage
 * @returns {Object} { positions: {}, waypoints: [], waypointEdges: [] }
 */
export const loadPositions = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return { positions: {}, waypoints: [], waypointEdges: [] };

        const parsed = JSON.parse(saved);

        // Handle legacy format (just positions object)
        if (!parsed.positions && !parsed.edgeData) {
            return { positions: parsed, edgeData: {} };
        }

        return {
            positions: parsed.positions || {},
            edgeData: parsed.edgeData || {}
        };
    } catch (error) {
        console.error('Error loading positions:', error);
        return { positions: {}, edgeData: {} };
    }
};

/**
 * Clear all saved positions
 */
export const clearPositions = () => {
    localStorage.removeItem(STORAGE_KEY);
};

/**
 * Check if a specific node has a saved position
 * @param {string} nodeId - Node ID to check
 * @returns {boolean}
 */
export const hasPosition = (nodeId) => {
    const positions = loadPositions();
    return positions.hasOwnProperty(nodeId);
};

/**
 * Get position for a specific node
 * @param {string} nodeId - Node ID
 * @returns {Object|null} Position object or null if not found
 */
export const getPosition = (nodeId) => {
    const positions = loadPositions();
    return positions[nodeId] || null;
};
