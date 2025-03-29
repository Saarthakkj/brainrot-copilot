import React, { useEffect, useRef, useState } from 'react';
import { useDrag } from '../hooks/useDrag';
import { calculateDimensions } from '../utils/dimensions';
import { useSpeechTranscription } from '../hooks/useSpeechTranscription';
import TranscriptionDisplay from './TranscriptionDisplay';
import '../styles.css';

const SPEECHMATICS_API_KEY = 'A7kaNtIVHCMxsCBIQYkMlzQN7A2njKLY';

const Overlay = () => {
    const overlayRef = useRef(null);
    const [time, setTime] = useState(new Date());
    const { isDragging, handleMouseDown, handleMouseMove, handleMouseUp } = useDrag(overlayRef);
    const { width, height } = calculateDimensions();

    const {
        isListening,
        transcript,
        partialTranscript,
        error,
        startListening,
        stopListening
    } = useSpeechTranscription(SPEECHMATICS_API_KEY);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // Automatically start transcription when overlay appears
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 3;

        const attemptStart = async () => {
            try {
                await startListening();
                console.log('[INFO] Transcription started automatically');
            } catch (err) {
                console.error('[ERROR] Failed to auto-start transcription:', err);

                // Retry up to maxRetries times
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`[INFO] Retrying transcription start (${retryCount}/${maxRetries})...`);
                    setTimeout(attemptStart, 1000); // Wait 1 second before retrying
                }
            }
        };

        // Start after a short delay to make sure everything is loaded
        setTimeout(attemptStart, 500);

        // Clean up by stopping transcription when component unmounts
        return () => {
            if (isListening) {
                stopListening();
            }
        };
    }, []);

    // Double click to toggle transcription
    const handleDoubleClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const timeStr = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div
            id="tab-capture-overlay"
            ref={overlayRef}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                position: 'fixed',
                left: '20px',
                top: '20px',
                zIndex: 999999
            }}
            className={`bg-black rounded-[44px] shadow-lg select-none flex flex-col pointer-events-auto overflow-hidden border-[10px] border-black ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
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

                <div className="app-content">
                    <div className="text-center py-2">
                        <h2 className="text-sm font-bold text-white">
                            {isListening ? "📝 Live Captions" : "Double-click to start"}
                        </h2>
                    </div>

                    <div className="tiktok-container flex-1 flex flex-col bg-gradient-to-br from-purple-900 to-pink-600">
                        {error && (
                            <div className="bg-red-800 text-white p-1 text-xs rounded-md m-2 text-center">
                                Error: {error}
                            </div>
                        )}

                        <TranscriptionDisplay
                            transcript={transcript}
                            partialTranscript={partialTranscript}
                            isListening={isListening}
                        />
                    </div>
                </div>

                <div className="home-indicator" />
            </div>
        </div>
    );
};

export default Overlay; 