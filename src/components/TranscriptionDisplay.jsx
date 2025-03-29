import React, { useEffect, useRef, useState } from 'react';

const TranscriptionDisplay = ({ transcript, partialTranscript, isListening }) => {
    const transcriptContainerRef = useRef(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [lastAudioUpdate, setLastAudioUpdate] = useState(Date.now());
    const [audioStatus, setAudioStatus] = useState('waiting'); // 'waiting', 'active', 'warning', 'error'
    const [noAudioTime, setNoAudioTime] = useState(0);
    const [lastWords, setLastWords] = useState('');
    const [displayedText, setDisplayedText] = useState('');
    const lastUpdateRef = useRef(Date.now());

    // Improved word extraction with smooth transitions
    useEffect(() => {
        const extractLastWords = () => {
            // Get the most recent text, prioritizing partial if it exists
            const currentText = partialTranscript || transcript || '';

            // Don't update if the change was too recent (prevents flickering)
            const now = Date.now();
            if (now - lastUpdateRef.current < 200) {
                return;
            }

            // Split into words and get the last few
            const words = currentText.trim().split(/\s+/);

            // If we have a partial transcript, show more words for context
            const numWordsToShow = partialTranscript ? 3 : 2;
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
    }, [transcript, partialTranscript]);

    // Auto-scroll to the bottom when transcript changes
    useEffect(() => {
        if (transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
        }
    }, [transcript, partialTranscript]);

    // Listen for audio level messages
    useEffect(() => {
        const handleMessage = (message) => {
            if (message.type === 'audio-level') {
                // console.log('[UI] Received audio level update:', message.level);
                setAudioLevel(message.level);
                setLastAudioUpdate(Date.now());
                setAudioStatus(message.level > 5 ? 'active' : 'waiting');
                setNoAudioTime(0);
            } else if (message.type === 'audio-data') {
                // Just receiving data is a good sign, even without level updates
                setLastAudioUpdate(Date.now());
                setNoAudioTime(0);
                // Don't change audio status here, let the level updates do that
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    // Check if we're getting audio updates
    useEffect(() => {
        const intervalId = setInterval(() => {
            const now = Date.now();
            const timeSinceUpdate = now - lastAudioUpdate;

            if (isListening) {
                if (timeSinceUpdate > 10000) {
                    // Critical problem - no updates for 10+ seconds
                    console.error('[UI] No audio updates received in the last 10 seconds');
                    setAudioStatus('error');
                    setNoAudioTime(timeSinceUpdate);
                } else if (timeSinceUpdate > 3000) {
                    // Warning level - no updates for 3+ seconds
                    console.warn('[UI] Audio updates seem delayed ( > 3s )');
                    setAudioStatus('warning');
                    setNoAudioTime(timeSinceUpdate);
                }
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isListening, lastAudioUpdate]);

    // Helper function to highlight if transcript is empty
    const isEmptyTranscript = !transcript?.trim() && !partialTranscript?.trim();

    // Determine bar color based on level and status
    const getBarColor = (level, status) => {
        if (status === 'error') return 'bg-red-600 animate-pulse';
        if (status === 'warning') return 'bg-yellow-500 animate-pulse';
        if (level > 70) return 'bg-green-500';
        if (level > 30) return 'bg-blue-500';
        if (level > 10) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getAudioStatusMessage = () => {
        switch (audioStatus) {
            case 'error':
                return `No audio updates for ${(noAudioTime / 1000).toFixed(0)}s. Audio capture may have failed.`;
            case 'warning':
                return `Audio updates delayed by ${(noAudioTime / 1000).toFixed(0)}s. Check browser audio.`;
            case 'waiting':
                return audioLevel < 10 ? 'Audio level is low. Try speaking louder or increase volume.' : '';
            default:
                return '';
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Small audio meter at the top */}
            {isListening && (
                <div className="w-full px-2 mb-2">
                    <div className="flex items-center">
                        <div className="flex-1 bg-gray-900 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-100 ${getBarColor(audioLevel, audioStatus)}`}
                                style={{ width: `${Math.max(1, audioLevel)}%` }}
                                id="audio-meter"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* TikTok-style caption container */}
            <div className="flex-1 relative w-full">
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    ref={transcriptContainerRef}
                >
                    {displayedText ? (
                        <div className="w-full px-4">
                            <div className="px-6 py-4 rounded-xl text-center max-w-full mx-auto">
                                <h1 className="text-white text-2xl font-extrabold leading-tight tracking-tight break-words transition-all duration-300 uppercase">
                                    {displayedText || '...'}
                                </h1>
                            </div>
                        </div>
                    ) : (
                        isListening ? (
                            <div className="text-center rounded-xl px-6 py-4">
                                <p className="text-white text-3xl font-bold uppercase">LISTENING...</p>
                            </div>
                        ) : (
                            <div className="text-center rounded-xl px-6 py-4">
                                <p className="text-gray-200 text-2xl font-bold uppercase">TRANSCRIPTION OFF</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default TranscriptionDisplay; 