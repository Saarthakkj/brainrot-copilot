import { useState, useEffect, useCallback } from 'react';

export const useDrag = (ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragState, setDragState] = useState({
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
    });

    const handleMouseDown = useCallback((e) => {
        if (!ref.current) return;
        const overlay = ref.current;

        // Initialize position with computed values to prevent teleporting
        if (
            overlay.style.right &&
            overlay.style.bottom &&
            (!overlay.style.left || !overlay.style.top)
        ) {
            const rect = overlay.getBoundingClientRect();
            overlay.style.left = `${rect.left}px`;
            overlay.style.top = `${rect.top}px`;
            overlay.style.right = "auto";
            overlay.style.bottom = "auto";
        }

        setIsDragging(true);
        setDragState({
            startX: e.clientX,
            startY: e.clientY,
            startLeft: parseInt(overlay.style.left || "5"),
            startTop: parseInt(overlay.style.top || "5"),
        });

        e.preventDefault();
        e.stopPropagation();
    }, [ref]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !ref.current) return;
        const overlay = ref.current;

        const newLeft = dragState.startLeft + (e.clientX - dragState.startX);
        const newTop = dragState.startTop + (e.clientY - dragState.startY);

        overlay.style.right = "auto";
        overlay.style.bottom = "auto";
        overlay.style.left = `${newLeft}px`;
        overlay.style.top = `${newTop}px`;
        e.preventDefault();
        e.stopPropagation();
    }, [isDragging, dragState, ref]);

    const handleMouseUp = useCallback((e) => {
        if (isDragging) {
            setIsDragging(false);
            e.preventDefault();
            e.stopPropagation();
        }
    }, [isDragging]);

    useEffect(() => {
        if (!ref.current) return;
        const overlay = ref.current;

        overlay.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('mouseup', handleMouseUp, true);

        return () => {
            overlay.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove, true);
            document.removeEventListener('mouseup', handleMouseUp, true);
        };
    }, [ref, handleMouseDown, handleMouseMove, handleMouseUp]);

    return {
        isDragging,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
}; 