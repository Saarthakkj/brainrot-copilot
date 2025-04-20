import React, { useEffect, useRef, useState, memo } from 'react';

// Use memo to prevent unnecessary re-renders
const TranscriptionDisplay = memo(({ transcript, partialTranscript, isListening, showTranscript = true }) => {
    const transcriptContainerRef = useRef(null);
    const [displayedText, setDisplayedText] = useState('');
    const lastUpdateRef = useRef(Date.now());

    // Process the caption text
    useEffect(() => {
        // If not showing transcript at all, don't process anything
        if (!showTranscript) {
            setDisplayedText('');
            return;
        }

        const processText = () => {
            // If not listening or no transcript, clear displayed text
            if (!isListening || !transcript) {
                setDisplayedText('');
                return;
            }

            // Get the text from transcript
            const currentText = transcript || '';

            // Don't update if the change was too recent (prevents flickering)
            const now = Date.now();
            if (now - lastUpdateRef.current < 200) {
                return;
            }

            // Split into words and get the last few
            const words = currentText.trim().split(/\s+/);

            // Show only 2 words for TikTok-style captions
            const numWordsToShow = 2;
            let relevantWords = words.slice(-numWordsToShow).join(' ');

            // Remove punctuation
            relevantWords = relevantWords.replace(/[.,!?;:]/g, '');

            // Convert to uppercase
            relevantWords = relevantWords.toUpperCase();

            // Only update if the text has actually changed
            if (relevantWords !== displayedText) {
                setDisplayedText(relevantWords);
                lastUpdateRef.current = now;
            }
        };

        processText();
    }, [transcript, isListening, showTranscript, displayedText]);

    // Auto-scroll to the bottom when transcript changes
    useEffect(() => {
        if (transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
        }
    }, [transcript]);

    // Only hide if explicitly told not to show transcript
    if (!showTranscript) {
        return null;
    }

    return (
        <div className="w-full h-full flex flex-col">
            {/* TikTok-style caption container */}
            <div className="flex-1 relative w-full">
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    ref={transcriptContainerRef}
                >
                    {displayedText ? (
                        <div className="w-full px-4">
                            <div className="px-6 py-4 rounded-xl text-center max-w-full mx-auto">
                                <h1
                                    className="text-white text-5xl font-extrabold leading-tight tracking-tight break-words uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
                                >
                                    {displayedText}
                                </h1>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center rounded-xl px-6 py-4">
                            <p className="text-white text-4xl font-bold uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                                {isListening ? "LOADING CAPTIONS..." : "WAITING FOR CAPTIONS..."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default TranscriptionDisplay;