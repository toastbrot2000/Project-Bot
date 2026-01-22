
export const getHelperLines = (change, nodes, distance = 5) => {
    const defaultResult = {
        horizontal: undefined,
        vertical: undefined,
        snapPosition: { x: undefined, y: undefined },
    };
    const node = change;

    if (!node.position || !node.width || !node.height) {
        return defaultResult;
    }

    const nodeBounds = {
        left: node.position.x,
        right: node.position.x + node.width,
        top: node.position.y,
        bottom: node.position.y + node.height,
        width: node.width,
        height: node.height,
        centerX: node.position.x + node.width / 2,
        centerY: node.position.y + node.height / 2,
    };

    let horizontal = undefined;
    let vertical = undefined;
    let snapX = undefined;
    let snapY = undefined;

    let minDistanceX = distance;
    let minDistanceY = distance;

    nodes.forEach((n) => {
        if (n.id === node.id || !n.position || !n.width || !n.height) {
            return;
        }

        const nBounds = {
            left: n.position.x,
            right: n.position.x + n.width,
            top: n.position.y,
            bottom: n.position.y + n.height,
            width: n.width,
            height: n.height,
            centerX: n.position.x + n.width / 2,
            centerY: n.position.y + n.height / 2,
        };

        // Vertical Alignment (Snap X)
        // Left to Left
        if (Math.abs(nodeBounds.left - nBounds.left) < minDistanceX) {
            minDistanceX = Math.abs(nodeBounds.left - nBounds.left);
            vertical = nBounds.left;
            snapX = nBounds.left;
        }
        // Right to Right
        if (Math.abs(nodeBounds.right - nBounds.right) < minDistanceX) {
            minDistanceX = Math.abs(nodeBounds.right - nBounds.right);
            vertical = nBounds.right;
            snapX = nBounds.right - nodeBounds.width;
        }
        // Left to Right
        if (Math.abs(nodeBounds.left - nBounds.right) < minDistanceX) {
            minDistanceX = Math.abs(nodeBounds.left - nBounds.right);
            vertical = nBounds.right;
            snapX = nBounds.right;
        }
        // Right to Left
        if (Math.abs(nodeBounds.right - nBounds.left) < minDistanceX) {
            minDistanceX = Math.abs(nodeBounds.right - nBounds.left);
            vertical = nBounds.left;
            snapX = nBounds.left - nodeBounds.width;
        }
        // Center to Center
        if (Math.abs(nodeBounds.centerX - nBounds.centerX) < minDistanceX) {
            minDistanceX = Math.abs(nodeBounds.centerX - nBounds.centerX);
            vertical = nBounds.centerX;
            snapX = nBounds.centerX - nodeBounds.width / 2;
        }

        // Horizontal Alignment (Snap Y)
        // Top to Top
        if (Math.abs(nodeBounds.top - nBounds.top) < minDistanceY) {
            minDistanceY = Math.abs(nodeBounds.top - nBounds.top);
            horizontal = nBounds.top;
            snapY = nBounds.top;
        }
        // Bottom to Bottom
        if (Math.abs(nodeBounds.bottom - nBounds.bottom) < minDistanceY) {
            minDistanceY = Math.abs(nodeBounds.bottom - nBounds.bottom);
            horizontal = nBounds.bottom;
            snapY = nBounds.bottom - nodeBounds.height;
        }
        // Top to Bottom
        if (Math.abs(nodeBounds.top - nBounds.bottom) < minDistanceY) {
            minDistanceY = Math.abs(nodeBounds.top - nBounds.bottom);
            horizontal = nBounds.bottom;
            snapY = nBounds.bottom;
        }
        // Bottom to Top
        if (Math.abs(nodeBounds.bottom - nBounds.top) < minDistanceY) {
            minDistanceY = Math.abs(nodeBounds.bottom - nBounds.top);
            horizontal = nBounds.top;
            snapY = nBounds.top - nodeBounds.height;
        }
        // Center to Center
        if (Math.abs(nodeBounds.centerY - nBounds.centerY) < minDistanceY) {
            minDistanceY = Math.abs(nodeBounds.centerY - nBounds.centerY);
            horizontal = nBounds.centerY;
            snapY = nBounds.centerY - nodeBounds.height / 2;
        }
    });

    return {
        horizontal,
        vertical,
        snapPosition: { x: snapX, y: snapY },
    };
};
