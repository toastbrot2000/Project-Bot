import React, { useEffect, useRef } from 'react';
import { useStore, Panel } from 'reactflow';

const HelperLinesRenderer = ({ horizontal, vertical }) => {
    const { transform } = useStore(store => ({
        transform: store.transform
    }));

    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpi = window.devicePixelRatio || 1;

        canvas.width = canvas.offsetWidth * dpi;
        canvas.height = canvas.offsetHeight * dpi;

        ctx.scale(dpi, dpi);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;

        const [tX, tY, tScale] = transform;

        if (horizontal !== undefined) {
            const y = horizontal * tScale + tY;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        if (vertical !== undefined) {
            const x = vertical * tScale + tX;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
    }, [horizontal, vertical, transform]);

    return (
        <Panel
            position="top-left"
            style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                margin: 0,
                padding: 0,
                zIndex: 10
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                }}
            />
        </Panel>
    );
};

export default HelperLinesRenderer;
