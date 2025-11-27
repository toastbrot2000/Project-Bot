import { useState, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { getHelperLines } from '../utils/helperLines';
import HelperLinesRenderer from '../components/HelperLinesRenderer';

export const useHelperLines = () => {
    const [helperLines, setHelperLines] = useState({ horizontal: undefined, vertical: undefined });
    const { getZoom } = useReactFlow();

    const onNodeDrag = useCallback((event, node, nodes, setNodes) => {
        const zoom = getZoom();
        const distance = 5 / zoom;
        const { horizontal, vertical, snapPosition } = getHelperLines(node, nodes, distance);

        if (horizontal !== undefined || vertical !== undefined) {
            setHelperLines({ horizontal, vertical });
        } else {
            setHelperLines({ horizontal: undefined, vertical: undefined });
        }

        if (snapPosition.x !== undefined || snapPosition.y !== undefined) {
            setNodes((nds) => nds.map((n) => {
                if (n.id === node.id) {
                    return {
                        ...n,
                        position: {
                            x: snapPosition.x ?? n.position.x,
                            y: snapPosition.y ?? n.position.y,
                        }
                    };
                }
                return n;
            }));
        }
    }, [getZoom]);

    const resetHelperLines = useCallback(() => {
        setHelperLines({ horizontal: undefined, vertical: undefined });
    }, []);

    const HelperLines = useCallback(() => {
        return <HelperLinesRenderer horizontal={helperLines.horizontal} vertical={helperLines.vertical} />;
    }, [helperLines]);

    return {
        onNodeDrag,
        resetHelperLines,
        HelperLines
    };
};
