import { useState, useCallback } from 'react';

export const useUndoRedo = (initialNodes = [], initialEdges = []) => {
    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);

    const takeSnapshot = useCallback((nodes, edges) => {
        setPast((prevPast) => {
            const newPast = [...prevPast, { nodes, edges }];
            // Optional: Limit history size
            if (newPast.length > 50) {
                newPast.shift();
            }
            return newPast;
        });
        setFuture([]);
    }, []);

    const clearHistory = useCallback(() => {
        setPast([]);
        setFuture([]);
    }, []);

    const undo = useCallback((currentNodes, currentEdges, setNodes, setEdges) => {
        setPast((prevPast) => {
            if (prevPast.length === 0) return prevPast;

            const previousState = prevPast[prevPast.length - 1];
            const newPast = prevPast.slice(0, prevPast.length - 1);

            setFuture((prevFuture) => [{ nodes: currentNodes, edges: currentEdges }, ...prevFuture]);

            setNodes(previousState.nodes);
            setEdges(previousState.edges);

            return newPast;
        });
    }, []);

    const redo = useCallback((currentNodes, currentEdges, setNodes, setEdges) => {
        setFuture((prevFuture) => {
            if (prevFuture.length === 0) return prevFuture;

            const nextState = prevFuture[0];
            const newFuture = prevFuture.slice(1);

            setPast((prevPast) => [...prevPast, { nodes: currentNodes, edges: currentEdges }]);

            setNodes(nextState.nodes);
            setEdges(nextState.edges);

            return newFuture;
        });
    }, []);

    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    return {
        takeSnapshot,
        undo,
        redo,
        canUndo,
        canRedo,
        clearHistory
    };
};
