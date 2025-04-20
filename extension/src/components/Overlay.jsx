import React, { useEffect, useRef, useState } from 'react';
import { useDrag } from './hooks/useDrag.js';
import { calculateDimensions } from '../utils/dimensions';
import { useYoutubeCaptions } from './hooks/useYoutubeCaptions';
import TranscriptionDisplay from './TranscriptionDisplay';
import VideoSwiper from './VideoSwiper';
import '../styles.css';

const Overlay = ({ isYouTubePage, videoId }) => {
    const overlayRef = useRef(null);
    const [time, setTime] = useState(new Date());
    const { isDragging, handleMouseDown, handleMouseMove, handleMouseUp } = useDrag(overlayRef);
    const { width, height } = calculateDimensions();
    const [error, setError] = useState(null);

    // YouTube captions hook
    const youtube = useYoutubeCaptions(isYouTubePage ? videoId : null);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // Handle YouTube caption errors
    useEffect(() => {
        if (isYouTubePage && youtube.error) {
            setError(`YouTube Captions Error: ${youtube.error}`);
        } else {
            setError(null);
        }
    }, [isYouTubePage, youtube.error]);

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
                zIndex: 999999,
                border: '12px solid black',
                borderRadius: '52px'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="fixed left-5 top-5 shadow-lg cursor-grab select-none flex flex-col pointer-events-auto overflow-hidden rounded-[52px] bg-black"
        >
            {/* Side buttons */}
            <div className="absolute -left-[10px] top-[120px] w-2 h-[60px] rounded-[2px] bg-[#222] z-[999999]" />
            <div className="absolute -left-[10px] top-[190px] w-2 h-[60px] rounded-[2px] bg-[#222] z-[999999]" />
            <div className="absolute -right-[10px] top-[140px] w-2 h-[70px] rounded-[2px] bg-[#222] z-[999999]" />

            <div className="w-full h-full flex flex-col relative overflow-hidden rounded-[40px] bg-black">
                <div className="flex-1 flex flex-col">
                    <div className="relative overflow-hidden flex-1 flex flex-col -mt-[50px]">
                        {/* VideoSwiper component */}
                        <VideoSwiper />

                        {/* Overlay captions and errors on top of the video */}
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-3 pointer-events-none">
                            {error && (
                                <div className="bg-red-800/90 text-white p-2 text-sm rounded-md m-2 text-center flex items-center justify-between pointer-events-auto">
                                    <div className="flex-1">
                                        <span className="font-medium">Error:</span> {error}
                                    </div>
                                    <button
                                        onClick={() => setError(null)}
                                        className="ml-2 text-white/70 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* TranscriptionDisplay for YouTube captions */}
                            {isYouTubePage && (
                                <TranscriptionDisplay
                                    transcript={youtube.currentCaption}
                                    partialTranscript=""
                                    isListening={!youtube.isLoading && youtube.currentCaption !== ''}
                                    showTranscript={true}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overlay;