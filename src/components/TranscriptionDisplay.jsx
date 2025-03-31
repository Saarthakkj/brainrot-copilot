import React, { useEffect, useRef, useState } from 'react';

const TranscriptionDisplay = ({ transcript, partialTranscript, isListening }) => {
    const transcriptContainerRef = useRef(null);
    const [displayedText, setDisplayedText] = useState('');
    const lastUpdateRef = useRef(Date.now());

    // Improved word extraction with smooth transitions
    useEffect(() => {
        const extractLastWords = () => {
            // If not listening, clear displayed text immediately
            if (!isListening) {
                setDisplayedText('');
                return;
            }

            // Get the most recent text, prioritizing partial if it exists
            const currentText = partialTranscript || transcript || '';

            // Don't update if the change was too recent (prevents flickering)
            const now = Date.now();
            if (now - lastUpdateRef.current < 200) {
                return;
            }

            // Split into words and get the last few
            const words = currentText.trim().split(/\s+/);

            // When using only partials, we show exactly 2 words for the TikTok-style
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

        extractLastWords();
    }, [transcript, partialTranscript, isListening]);

    // Auto-scroll to the bottom when transcript changes
    useEffect(() => {
        if (transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
        }
    }, [transcript, partialTranscript]);

    return (
        <div className="w-full h-full flex flex-col">
            {/* TikTok-style caption container */}
            <div className="flex-1 relative w-full">
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    ref={transcriptContainerRef}
                >
                    {isListening && (
                        displayedText ? (
                            <div className="w-full px-4">
                                <div className="px-6 py-4 rounded-xl text-center max-w-full mx-auto">
                                    <h1 className="text-white text-2xl font-extrabold leading-tight tracking-tight break-words transition-all duration-300 uppercase">
                                        {displayedText}
                                    </h1>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center rounded-xl px-6 py-4">
                                <p className="text-white text-3xl font-bold uppercase">LISTENING...</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default TranscriptionDisplay; 