import React, { useEffect, useRef, useState } from 'react';
import { useDrag } from '../hooks/useDrag';
import { calculateDimensions } from '../utils/dimensions';
import { useSpeechTranscription } from '../hooks/useSpeechTranscription';
import TranscriptionDisplay from './TranscriptionDisplay';
import VideoSwiper from './VideoSwiper';
import ApiKeyDialog from './ApiKeyDialog';
import '../styles.css';
import { Switch } from './ui/Switch';

const Overlay = () => {
    const overlayRef = useRef(null);
    const [time, setTime] = useState(new Date());
    const { isDragging, handleMouseDown, handleMouseMove, handleMouseUp } = useDrag(overlayRef);
    const { width, height } = calculateDimensions();
    const [showCaptions, setShowCaptions] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
    const [isLoadingApiKey, setIsLoadingApiKey] = useState(true);

    // Define videos for the swiper
    const videos = [
        { src: "videos/subway-surfers.mp4" },
        { src: "videos/gta-5.mp4" }
    ];

    const {
        isListening,
        transcript,
        partialTranscript,
        error,
        audioLevel,
        showTranscript,
        startListening,
        stopListening
    } = useSpeechTranscription(apiKey);

    // Load API key from storage when component mounts
    useEffect(() => {
        chrome.storage.sync.get(['speechmaticsApiKey'], (result) => {
            if (result.speechmaticsApiKey) {
                setApiKey(result.speechmaticsApiKey);
                setShowCaptions(true); // Enable captions by default if API key exists
            }
            setIsLoadingApiKey(false);
            // Only show dialog if we don't have an API key
            if (!result.speechmaticsApiKey) {
                setShowApiKeyDialog(true);
            }
        });
    }, []);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // Start transcription when API key is available and captions are enabled
    useEffect(() => {
        if (isLoadingApiKey) return; // Wait until we know if we have an API key

        if (showCaptions) {
            if (apiKey) {
                // We have an API key, start listening
                const attemptStart = async () => {
                    try {
                        await startListening();
                        console.log('[INFO] Transcription started');
                    } catch (err) {
                        console.error('[ERROR] Failed to start transcription:', err);
                        // If we get an error starting, the API key might be invalid
                        // Prompt for a new one
                        setShowApiKeyDialog(true);
                    }
                };

                attemptStart();
            } else {
                // No API key, show dialog
                setShowApiKeyDialog(true);
            }
        } else if (isListening) {
            // If captions are toggled off, stop listening
            stopListening();
        }
    }, [showCaptions, apiKey, isLoadingApiKey]);

    // Double click to toggle transcription
    const handleDoubleClick = () => {
        if (apiKey) {
            setShowCaptions(!showCaptions);
        } else {
            // No API key, show dialog
            setShowApiKeyDialog(true);
        }
    };

    // Handle API key save
    const handleSaveApiKey = (newApiKey) => {
        // Save to Chrome storage
        chrome.storage.sync.set({ speechmaticsApiKey: newApiKey }, () => {
            console.log('[INFO] API key saved to storage');
            setApiKey(newApiKey);
            setShowApiKeyDialog(false);
            setShowCaptions(true); // Turn on captions
        });
    };

    // Handle API key dialog cancel
    const handleCancelApiKey = () => {
        setShowApiKeyDialog(false);
        // If no API key, turn captions off
        if (!apiKey) {
            setShowCaptions(false);
        }
    };

    // Toggle transcription on/off with immediate UI feedback
    const handleToggleTranscription = () => {
        if (!showCaptions && !apiKey) {
            // If turning on captions but no API key, show dialog
            setShowApiKeyDialog(true);
        } else {
            // Otherwise just toggle
            setShowCaptions(!showCaptions);
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
            className="fixed left-5 top-5 shadow-lg cursor-grab select-none flex flex-col pointer-events-auto overflow-hidden rounded-[44px] bg-black"
        >
            {/* Side buttons */}
            <div className="absolute -left-[8px] top-[100px] w-2 h-[50px] rounded-[2px] bg-[#222] z-[999999]" />
            <div className="absolute -left-[8px] top-[160px] w-2 h-[50px] rounded-[2px] bg-[#222] z-[999999]" />
            <div className="absolute -right-[8px] top-[120px] w-2 h-[60px] rounded-[2px] bg-[#222] z-[999999]" />

            <div className="w-full h-full flex flex-col relative overflow-hidden rounded-[34px] bg-black">
                <div className="flex-1 flex flex-col">
                    <div className="relative overflow-hidden flex-1 flex flex-col -mt-[30px]">
                        {/* VideoSwiper component */}
                        <VideoSwiper videos={videos} />

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
                                showTranscript={showTranscript}
                            />
                        </div>
                    </div>
                </div>

                {/* Transcription Toggle */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[999999]">
                    <div className="flex items-center bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full gap-2 border border-white/20">
                        <span className="text-white text-sm font-medium">Captions</span>
                        <Switch
                            checked={showCaptions}
                            onCheckedChange={handleToggleTranscription}
                        />
                    </div>
                </div>
            </div>

            {/* API Key Dialog */}
            {showApiKeyDialog && (
                <ApiKeyDialog
                    onSave={handleSaveApiKey}
                    onCancel={handleCancelApiKey}
                />
            )}
        </div>
    );
};

export default Overlay; 