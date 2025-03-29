import React, { useEffect, useRef, useState } from 'react';

const TranscriptionDisplay = ({ transcript, partialTranscript, isListening }) => {
    const transcriptContainerRef = useRef(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [lastAudioUpdate, setLastAudioUpdate] = useState(Date.now());
    const [audioStatus, setAudioStatus] = useState('waiting'); // 'waiting', 'active', 'warning', 'error'
    const [noAudioTime, setNoAudioTime] = useState(0);

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
        <div className="w-full h-full flex flex-col px-4">
            {isListening && (
                <div className="w-full mb-4 p-2 bg-gray-800 rounded border border-gray-700">
                    <div className="flex items-center">
                        <div className="text-sm text-white mr-2 min-w-[100px]">Audio: {audioLevel.toFixed(0)}%</div>
                        <div className="flex-1 bg-gray-900 h-6 rounded-full overflow-hidden border border-gray-700" id="audio-meter">
                            <div
                                className={`h-full rounded-full transition-all duration-100 ${getBarColor(audioLevel, audioStatus)}`}
                                style={{ width: `${Math.max(1, audioLevel)}%` }}
                            />
                        </div>
                    </div>

                    {getAudioStatusMessage() && (
                        <div className={`text-sm mt-1 ${audioStatus === 'error' ? 'text-red-400' : audioStatus === 'warning' ? 'text-yellow-400' : 'text-gray-300'}`}>
                            {getAudioStatusMessage()}
                        </div>
                    )}

                    {audioStatus === 'error' && (
                        <div className="mt-2 bg-red-900/50 p-2 rounded text-xs text-white">
                            <p className="font-bold">Troubleshooting steps:</p>
                            <ol className="list-decimal pl-4 mt-1 space-y-1">
                                <li>Make sure the tab is playing audio.</li>
                                <li>Try refreshing the page.</li>
                                <li>Restart the extension by clicking the icon again.</li>
                                <li>Check console for errors (F12 → Console).</li>
                            </ol>
                        </div>
                    )}
                </div>
            )}
            <div className="w-full flex-1">
                <div
                    ref={transcriptContainerRef}
                    className="bg-gray-900 rounded-lg p-4 h-[60vh] overflow-y-auto text-white mb-2"
                >
                    {transcript && (
                        <div className="mb-2 text-base font-semibold">
                            {transcript}
                        </div>
                    )}
                    {partialTranscript && (
                        <div className="text-gray-300 italic">
                            {partialTranscript}
                        </div>
                    )}
                    {isEmptyTranscript && isListening && (
                        <div className="text-yellow-400 italic text-center mt-20 border border-yellow-500 p-4 rounded">
                            <p className="font-semibold mb-2">Waiting for speech...</p>
                            <p className="text-sm">
                                Make sure your browser tab is playing audio. Try speaking loudly or playing audio with speech.
                            </p>
                            <p className="text-sm mt-2">
                                Check the console logs for "[AUDIO LEVELS]" and "[AUDIO STATS]" to verify audio is being captured.
                            </p>
                        </div>
                    )}
                    {!isListening && isEmptyTranscript && (
                        <div className="text-gray-400 text-center mt-20">
                            Press Start to begin transcription
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TranscriptionDisplay; 