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
    const [showCaptions, setShowCaptions] = useState(true);

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

    // Toggle transcription on/off with immediate UI feedback
    const handleToggleTranscription = () => {
        // Update UI state immediately
        setShowCaptions(!showCaptions);

        // Handle actual transcription service in the background
        if (showCaptions) {
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
                    <div className="tiktok-container">
                        <video
                            src={chrome.runtime.getURL("videos/subway-surfers.mp4")}
                            autoPlay
                            loop
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        <div className="relative z-10 flex flex-col flex-1 p-3">
                            {error && (
                                <div className="bg-red-800 text-white p-1 text-xs rounded-md m-2 text-center">
                                    Error: {error}
                                </div>
                            )}

                            <TranscriptionDisplay
                                transcript={transcript}
                                partialTranscript={partialTranscript}
                                isListening={showCaptions && isListening}
                            />
                        </div>
                    </div>
                </div>

                {/* Transcription Toggle */}
                <div className="transcription-toggle-container">
                    <div className="transcription-toggle">
                        <span className="toggle-label">Captions</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={showCaptions}
                                onChange={handleToggleTranscription}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div className="home-indicator" />
            </div>
        </div>
    );
};

export default Overlay; 