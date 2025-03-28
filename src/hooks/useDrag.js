import { useState, useEffect } from 'react';

export const useDrag = (ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragState, setDragState] = useState({
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
    });

    useEffect(() => {
        if (!ref.current) return;

        const overlay = ref.current;

        const handleMouseDown = (e) => {
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
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const newLeft = dragState.startLeft + (e.clientX - dragState.startX);
            const newTop = dragState.startTop + (e.clientY - dragState.startY);

            overlay.style.right = "auto";
            overlay.style.bottom = "auto";
            overlay.style.left = `${newLeft}px`;
            overlay.style.top = `${newTop}px`;
            e.preventDefault();
            e.stopPropagation();
        };

        const handleMouseUp = (e) => {
            if (isDragging) {
                setIsDragging(false);
                e.preventDefault();
                e.stopPropagation();
            }
        };

        overlay.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('mouseup', handleMouseUp, true);

        return () => {
            overlay.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove, true);
            document.removeEventListener('mouseup', handleMouseUp, true);
        };
    }, [ref, isDragging, dragState]);

    return {
        isDragging,
        handleMouseDown: (e) => {
            if (!ref.current) return;
            const overlay = ref.current;
            handleMouseDown(e);
        },
        handleMouseMove: (e) => {
            if (!ref.current) return;
            handleMouseMove(e);
        },
        handleMouseUp: (e) => {
            if (!ref.current) return;
            handleMouseUp(e);
        },
    };
}; 