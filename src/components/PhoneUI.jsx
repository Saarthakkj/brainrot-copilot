import React, { useState, useEffect } from 'react';

const AppIcon = ({ app }) => {
    return (
        <div className="flex flex-col items-center w-14 transition-all duration-200 ease-in-out hover:scale-110 hover:opacity-80">
            <div className="w-14 h-14 rounded-[18px] overflow-hidden shadow-lg mb-1">
                <img
                    src={chrome.runtime.getURL(app.icon)}
                    alt={app.name}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="text-[10px] text-white text-center truncate w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                {app.name}
            </div>
        </div>
    );
};

const AudioMeter = ({ level, warning }) => {
    const style = {
        background: warning
            ? `linear-gradient(90deg, #ff5252 ${Math.min(30, level)}%, rgba(255,82,82,0.1) ${Math.min(30, level)}%)`
            : `linear-gradient(90deg, #0d84fc ${level}%, rgba(13,132,252,0.1) ${level}%)`,
        animation: warning ? 'pulse 1s infinite' : ''
    };

    return <div id="audio-meter" style={style} className="h-2 w-full rounded-full" />;
};

const PhoneUI = ({ width, height, apps, audioLevelData }) => {
    const [time, setTime] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // Listen for audio level updates from outside React
    useEffect(() => {
        const handleAudioUpdate = (event) => {
            // If this component implements audio level visualization
            // Update it based on event.detail.level
        };

        window.addEventListener('audioLevelUpdate', handleAudioUpdate);
        return () => window.removeEventListener('audioLevelUpdate', handleAudioUpdate);
    }, []);

    const timeStr = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div
            id="tab-capture-overlay"
            style={{
                width: `${width}px`,
                height: `${height}px`
            }}
            className="fixed left-5 top-5 bg-black rounded-[44px] shadow-lg cursor-grab select-none flex flex-col pointer-events-auto z-max overflow-hidden border-[10px] border-black"
        >
            {/* iPhone notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[25px] bg-black rounded-b-[14px] z-max-plus" />

            {/* Volume buttons */}
            <div className="absolute -left-[12px] top-[100px] w-1 h-[50px] bg-[#222] rounded-[2px] z-max-plus" />
            <div className="absolute -left-[12px] top-[160px] w-1 h-[50px] bg-[#222] rounded-[2px] z-max-plus" />

            {/* Power button */}
            <div className="absolute -right-[12px] top-[120px] w-1 h-[60px] bg-[#222] rounded-[2px] z-max-plus" />

            {/* Main content */}
            <div className="w-full h-full flex flex-col relative bg-gradient-to-br from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d]">
                {/* Status bar */}
                <div className="flex justify-between px-4 py-1 text-white text-xs font-bold h-6 bg-black/20 backdrop-blur">
                    <div>{timeStr}</div>
                    <div className="flex gap-1">
                        <span>📶</span>
                        <span>🔋</span>
                    </div>
                </div>

                {/* App grid */}
                <div className="flex-1 grid grid-cols-3 gap-3 p-3 pt-12">
                    {apps.map((app, index) => (
                        <AppIcon key={index} app={app} />
                    ))}
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[30%] h-1 bg-white/50 rounded" />

                {/* Audio meter visualization if needed */}
                {audioLevelData && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[70%]">
                        <AudioMeter
                            level={audioLevelData.level}
                            warning={audioLevelData.warning}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhoneUI; 