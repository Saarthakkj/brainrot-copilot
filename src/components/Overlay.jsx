import React, { useEffect, useRef } from 'react';

const apps = [
    { name: 'Fortnite', icon: 'icons/fortnite.png' },
    { name: 'Rocket League', icon: 'icons/rocket-league.png' },
    { name: 'Minecraft', icon: 'icons/minecraft.png' },
    { name: 'Slime', icon: 'icons/slime.png' },
    { name: 'Subway Surfers', icon: 'icons/subway-surfers.png' }
];

const AppIcon = ({ app }) => (
    <div className="app-icon">
        <div className="app-icon-image">
            <img src={chrome.runtime.getURL(app.icon)} alt={app.name} />
        </div>
        <div className="app-icon-name">{app.name}</div>
    </div>
);

const Overlay = () => {
    const overlayRef = useRef(null);

    // Calculate dimensions based on iPhone proportions (19.5:9)
    const height = window.innerHeight * 0.7;
    const width = height * (9 / 19.5); // iPhone aspect ratio

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Setup drag functionality
    useEffect(() => {
        if (!overlayRef.current) return;

        const overlay = overlayRef.current;

        const dragState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            startLeft: 0,
            startTop: 0,
        };

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

            dragState.isDragging = true;
            dragState.startX = e.clientX;
            dragState.startY = e.clientY;
            dragState.startLeft = parseInt(overlay.style.left || "5");
            dragState.startTop = parseInt(overlay.style.top || "5");

            overlay.style.cursor = "grabbing";
            e.preventDefault();
            e.stopPropagation();
        };

        const handleMouseMove = (e) => {
            if (!dragState.isDragging) return;

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
            if (dragState.isDragging) {
                dragState.isDragging = false;
                overlay.style.cursor = "grab";
                e.preventDefault();
                e.stopPropagation();
            }
        };

        overlay.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('mouseup', handleMouseUp, true);

        // Clean up event listeners
        return () => {
            overlay.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove, true);
            document.removeEventListener('mouseup', handleMouseUp, true);
        };
    }, []);

    return (
        <div
            id="tab-capture-overlay"
            ref={overlayRef}
            style={{ width: `${width}px`, height: `${height}px` }}
            className="fixed left-5 top-5 bg-black rounded-[44px] shadow-lg cursor-grab select-none flex flex-col pointer-events-auto z-max overflow-hidden border-[10px] border-black"
        >
            <div className="notch" />
            <div className="volume-button volume-up" />
            <div className="volume-button volume-down" />
            <div className="power-button" />
            <div className="content">
                <div className="status-bar">
                    <div>{timeStr}</div>
                    <div className="status-icons">
                        <span>📶</span>
                        <span>🔋</span>
                    </div>
                </div>
                <div className="app-grid">
                    {apps.map((app) => (
                        <AppIcon key={app.name} app={app} />
                    ))}
                </div>
                <div className="home-indicator" />
            </div>
        </div>
    );
};

export default Overlay; 