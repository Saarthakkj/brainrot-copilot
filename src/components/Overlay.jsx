import React, { useEffect, useRef, useState } from 'react';
import { useDrag } from '../hooks/useDrag';
import { AppIcon } from './AppIcon';
import { apps } from '../constants/apps';
import { calculateDimensions } from '../utils/dimensions';
import '../styles.css';

const Overlay = () => {
    const overlayRef = useRef(null);
    const [time, setTime] = useState(new Date());
    const { isDragging, handleMouseDown, handleMouseMove, handleMouseUp } = useDrag(overlayRef);
    const { width, height } = calculateDimensions();

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const timeStr = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div
            id="tab-capture-overlay"
            ref={overlayRef}
            style={{ width: `${width}px`, height: `${height}px` }}
            className={`fixed left-5 top-5 bg-black rounded-[44px] shadow-lg select-none flex flex-col pointer-events-auto z-max overflow-hidden border-[10px] border-black ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
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