import { useState, useEffect, useRef } from 'react';
import { RealtimeClient } from '@speechmatics/real-time-client';

// Sample rate for audio processing
const AUDIO_SAMPLE_RATE = 48000;
// Add a gain factor to boost audio levels
const AUDIO_GAIN = 3.0;
// Timeout in ms to hide transcript when no new text is received
const TRANSCRIPT_HIDE_TIMEOUT = 2000;

export const useSpeechTranscription = (apiKey) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [showTranscript, setShowTranscript] = useState(true);

    const clientRef = useRef(null);
    const messageListenerRef = useRef(null);
    const timeoutRef = useRef(null);
    const lastTranscriptRef = useRef(''); // To track the last significant transcript content

    // Add new refs for audio processing
    const lastAudioDataRef = useRef(null);
    const silenceCountRef = useRef(0);

    // Modified function to always keep captions visible
    const resetHideTimeout = (newContent) => {
        // Only reset if we have genuinely new content
        if (newContent && newContent === lastTranscriptRef.current) {
            return; // Skip if same content
        }

        // Update our reference to the latest content
        if (newContent) {
            lastTranscriptRef.current = newContent;
        }

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Always show the transcript - remove timeout behavior
        setShowTranscript(true);
        
        // No longer setting a timeout to hide captions
        // timeoutRef.current = setTimeout(() => {
        //     setShowTranscript(false);
        // }, TRANSCRIPT_HIDE_TIMEOUT);
    };

    const fetchJWT = async (apiKey) => {
        try {
            console.log('[INFO] Fetching JWT with API key');
            const response = await fetch('https://mp.speechmatics.com/v1/api_keys?type=rt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    ttl: 3600,
                }),
            });

            if (!response.ok) {
                // Extract more detailed error message if available
                let errorMessage = 'Invalid API key or service unavailable';
                try {
                    const errorData = await response.json();
                    if (response.status === 401) {
                        errorMessage = 'Invalid API key. Please check your Speechmatics API key and try again.';
                    } else if (response.status === 403) {
                        errorMessage = 'Access denied. Your API key may have expired or have insufficient permissions.';
                    } else if (response.status === 429) {
                        errorMessage = 'Too many requests. Please wait a moment and try again.';
                    } else {
                        errorMessage = errorData.detail || errorData.message || errorMessage;
                    }
                } catch (e) {
                    // If we can't parse the error JSON, stick with the default message
                }

                throw new Error(errorMessage, { cause: response });
            }

            const data = await response.json();
            return data.key_value;
        } catch (error) {
            console.error('[ERROR] JWT fetch failed:', error);
            throw new Error(error.message || 'Failed to authenticate with Speechmatics');
        }
    };

    const startListening = async () => {
        try {
            if (!apiKey) {
                throw new Error('API key is required');
            }

            setError(null);
            setTranscript('');
            setPartialTranscript('');
            lastTranscriptRef.current = ''; // Reset the last transcript reference

            // Check API key validity by fetching a JWT
            let jwt;
            try {
                jwt = await fetchJWT(apiKey);
            } catch (err) {
                console.error('[ERROR] JWT fetch failed with error:', err);
                setError('Invalid API key: ' + err.message);
                throw new Error('API key validation failed: ' + err.message);
            }

            // Initialize Speechmatics client
            clientRef.current = new RealtimeClient();

            // Set up event listeners for transcription
            clientRef.current.addEventListener('receiveMessage', ({ data }) => {
                // console.log('[DEBUG] Received Speechmatics message:', data.message); // DEBUG

                if (data.message === 'AddPartialTranscript') {
                    // console.log('[DEBUG] AddPartialTranscript full data:', JSON.stringify(data)); // DEBUG
                    const partialText = data.results
                        .map((r) => r.alternatives?.[0]?.content || '')
                        .join(' ');

                    // Extract significant words for comparison
                    const words = partialText.trim().split(/\s+/);
                    const significantContent = words.slice(-2).join(' '); // Last 2 words

                    setPartialTranscript(partialText);
                    // Also add partial text to the transcript to create a continuous flow
                    setTranscript(prev => {
                        // Only add new words not already in the transcript
                        const words = partialText.split(' ');
                        const lastWord = words[words.length - 1];
                        if (lastWord && !prev.endsWith(lastWord)) {
                            return prev + ' ' + lastWord;
                        }
                        return prev;
                    });

                    // Reset the hide timeout whenever genuinely new text is received
                    resetHideTimeout(significantContent);

                    // console.log(`[PARTIAL] ${partialText}`); // VERBOSE
                } else if (data.message === 'AddTranscript') {
                    // Skip processing final transcripts to avoid repeating words
                    // We're now relying solely on partial transcripts for the display
                    console.log('[INFO] Skipping final transcript to avoid repetition');
                } else if (data.message === 'EndOfTranscript') {
                    console.log('[INFO] End of transcript received');
                } else if (data.message === 'Error') {
                    console.error('[ERROR] Speechmatics error:', data.error);
                    console.error('[ERROR] Full error data:', JSON.stringify(data));
                    let errorMessage = data.error || 'Unknown error occurred';

                    // Make error messages more user-friendly
                    if (errorMessage.includes('language')) {
                        errorMessage = 'Language detection failed. Please try speaking again.';
                    } else if (errorMessage.includes('audio')) {
                        errorMessage = 'Audio processing error. Please check your microphone and try again.';
                    } else if (errorMessage.includes('quota')) {
                        errorMessage = 'API quota exceeded. Please try again later.';
                    }

                    setError(errorMessage);
                } else if (data.message === 'Warning') {
                    console.warn('[WARNING] Speechmatics warning:', data);
                } else {
                    // console.log('[INFO] Speechmatics message:', data.message, data); // VERBOSE
                }
            });

            // Add more event listeners for connection events
            clientRef.current.addEventListener('open', () => {
                console.log('[INFO] Speechmatics connection opened');
            });

            clientRef.current.addEventListener('close', (event) => {
                console.log('[INFO] Speechmatics connection closed', event);
            });

            clientRef.current.addEventListener('error', (error) => {
                console.error('[ERROR] Speechmatics connection error:', error);
                let errorMessage = 'Connection error occurred';
                if (error.message.includes('WebSocket')) {
                    errorMessage = 'Connection lost. Please check your internet connection and try again.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Connection timed out. Please try again.';
                }
                setError(errorMessage);
            });

            // Start the client with JWT using the 'standard' operating point for speed
            await clientRef.current.start(jwt, {
                transcription_config: {
                    language: 'en',
                    enable_partials: true,
                    operating_point: 'standard' // Use standard model for faster speed
                },
                audio_format: {
                    type: 'raw',
                    encoding: 'pcm_f32le',
                    sample_rate: AUDIO_SAMPLE_RATE
                }
            });

            console.log('[CONFIG] Speechmatics started with sample rate:', AUDIO_SAMPLE_RATE, 'and operating point: standard');

            // Set up message listener for audio data
            setupAudioMessageListener();

            // First request direct access to tab audio
            try {
                console.log('[AUDIO] Requesting tab audio stream access...');
                chrome.runtime.sendMessage({
                    type: 'get-audio-stream',
                    target: 'background'
                }, (response) => {
                    if (response && response.success) {
                        console.log('[AUDIO] Successfully requested tab audio stream');
                    } else {
                        console.warn('[AUDIO] Failed to get tab audio stream:', response?.error);
                    }
                });
            } catch (err) {
                console.error('[AUDIO] Error requesting tab audio stream:', err);
            }

            // Then enable transcription in the offscreen document
            chrome.runtime.sendMessage({
                type: 'enable-transcription',
                target: 'background',
                enable: true
            });

            setIsListening(true);
            return true; // Return true for success
        } catch (err) {
            setError(err.message);
            console.error('Error starting transcription:', err);
            throw err; // Rethrow to allow caller to handle
        }
    };

    const stopListening = async () => {
        try {
            // Disable transcription in the offscreen document
            chrome.runtime.sendMessage({
                type: 'enable-transcription',
                target: 'background',
                enable: false
            });

            // Remove message listener
            if (messageListenerRef.current) {
                chrome.runtime.onMessage.removeListener(messageListenerRef.current);
                messageListenerRef.current = null;
            }

            // Clear the hide timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            // Reset transcript tracking
            lastTranscriptRef.current = '';
            setShowTranscript(false);

            // Reset audio processing state
            lastAudioDataRef.current = null;
            silenceCountRef.current = 0;

            // Properly end the Speechmatics session
            if (clientRef.current) {
                try {
                    // Send a small buffer of silence to ensure there's enough data
                    const silenceBuffer = new Float32Array(4096).buffer;
                    for (let i = 0; i < 5; i++) {
                        clientRef.current.sendAudio(silenceBuffer);
                    }

                    // Allow a little time for the audio to be processed
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Explicitly tell Speechmatics we're done sending audio, with timeout handling
                    try {
                        await clientRef.current.stopRecognition();
                        console.log('[INFO] Stopped Speechmatics recognition');
                    } catch (stopErr) {
                        // If timeout, close the connection anyway
                        console.warn('[WARN] Timeout waiting for EndOfTranscript, closing connection anyway:', stopErr.message);
                        clientRef.current.socket?.close();
                    }

                    clientRef.current = null;
                } catch (err) {
                    console.error('[ERROR] Error ending Speechmatics session:', err);
                    // Force cleanup even on error
                    clientRef.current = null;
                }
            }

            setIsListening(false);
        } catch (err) {
            console.error('Error stopping transcription:', err);
            setIsListening(false);
        }
    };

    // Set up a listener for audio data messages from the extension
    const setupAudioMessageListener = () => {
        // For tracking audio stats
        let packetCount = 0;
        let audioSampleCount = 0;
        let lastLogTime = Date.now();
        const LOG_INTERVAL = 5000; // Log stats less frequently (every 5 seconds)

        const messageListener = (message, sender, sendResponse) => {
            if (message.type === 'audio-data' && clientRef.current) {
                try {
                    // Convert the array data back to Float32Array
                    const float32Data = new Float32Array(message.data);

                    // Track audio statistics
                    packetCount++;
                    audioSampleCount += float32Data.length;

                    // Boost the audio data (similar to the example extension)
                    const boostedData = new Float32Array(float32Data.length);
                    for (let i = 0; i < float32Data.length; i++) {
                        // Apply gain while clamping to [-1, 1] range
                        boostedData[i] = Math.max(-1, Math.min(1, float32Data[i] * AUDIO_GAIN));
                    }

                    // Calculate audio levels
                    const rms = Math.sqrt(boostedData.reduce((sum, x) => sum + x * x, 0) / boostedData.length);
                    const dbFS = 20 * Math.log10(rms || 0.0000001);
                    const hasAudio = boostedData.some(sample => Math.abs(sample) > 0.01);

                    // Update audio level state for UI
                    setAudioLevel(Math.min(100, rms * 100));

                    // Log stats periodically
                    const now = Date.now();
                    if (now - lastLogTime > LOG_INTERVAL) {
                        const nonSilentSamples = boostedData.filter(x => Math.abs(x) > 0.01).length;
                        const percentAudible = (nonSilentSamples / boostedData.length * 100).toFixed(1);
                        // Less verbose stats logging
                        console.log(`[AUDIO STATS] Packets/s: ${(packetCount / (LOG_INTERVAL / 1000)).toFixed(1)}, Samples/s: ${(audioSampleCount / (LOG_INTERVAL / 1000)).toFixed(0)}, RMS: ${rms.toFixed(4)}, Audible: ${percentAudible}%`);

                        lastLogTime = now;
                        packetCount = 0;
                        audioSampleCount = 0;
                    }

                    // Handle consecutive silence detection
                    if (!hasAudio) {
                        silenceCountRef.current++;

                        // After about 1 second of silence (depends on packet rate), hide transcript
                        if (silenceCountRef.current > 10 && showTranscript) {
                            setShowTranscript(false);
                            if (timeoutRef.current) {
                                clearTimeout(timeoutRef.current);
                                timeoutRef.current = null;
                            }
                        }

                        if (silenceCountRef.current > 30) {
                            if (silenceCountRef.current % 5 !== 0) {
                                if (sendResponse) sendResponse({ success: true });
                                return true;
                            }
                        }
                    } else {
                        silenceCountRef.current = 0;
                    }

                    // Store the last audio data
                    lastAudioDataRef.current = boostedData;

                    // Send the boosted audio to Speechmatics
                    clientRef.current.sendAudio(boostedData.buffer);

                    if (sendResponse) sendResponse({ success: true });
                } catch (err) {
                    console.error('[ERROR] Error processing audio data:', err);
                    if (sendResponse) sendResponse({ success: false, error: err.message });
                }
                return true; // Keep the message channel open
            } else if (message.type === 'audio-level') {
                // Update the audio level state for UI
                setAudioLevel(message.level);
                return true;
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);
        messageListenerRef.current = messageListener;
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            // Clear the hide timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            stopListening();
        };
    }, []);

    return {
        isListening,
        transcript,
        partialTranscript,
        error,
        audioLevel,
        showTranscript,
        startListening,
        stopListening
    };
}; 