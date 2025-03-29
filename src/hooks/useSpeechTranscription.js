import { useState, useEffect, useRef } from 'react';
import { RealtimeClient } from '@speechmatics/real-time-client';

// Sample rate for audio processing
const AUDIO_SAMPLE_RATE = 48000;
// Add a gain factor to boost audio levels
const AUDIO_GAIN = 3.0;

export const useSpeechTranscription = (apiKey) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const clientRef = useRef(null);
    const messageListenerRef = useRef(null);

    // Add new refs for audio processing
    const lastAudioDataRef = useRef(null);
    const silenceCountRef = useRef(0);

    const fetchJWT = async (apiKey) => {
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
            throw new Error('Bad response from API', { cause: response });
        }

        const data = await response.json();
        return data.key_value;
    };

    const startListening = async () => {
        try {
            if (!apiKey) {
                throw new Error('API key is required');
            }

            setError(null);
            setTranscript('');
            setPartialTranscript('');

            // Initialize Speechmatics client
            clientRef.current = new RealtimeClient();

            // Set up event listeners for transcription
            clientRef.current.addEventListener('receiveMessage', ({ data }) => {
                console.log('[DEBUG] Received Speechmatics message:', data.message);

                if (data.message === 'AddPartialTranscript') {
                    console.log('[DEBUG] AddPartialTranscript full data:', JSON.stringify(data));
                    const partialText = data.results
                        .map((r) => r.alternatives?.[0]?.content || '')
                        .join(' ');
                    setPartialTranscript(partialText);
                    console.log(`[PARTIAL] ${partialText}`);
                } else if (data.message === 'AddTranscript') {
                    console.log('[DEBUG] AddTranscript full data:', JSON.stringify(data));
                    const text = data.results
                        .map((r) => r.alternatives?.[0]?.content || '')
                        .join(' ');
                    setTranscript(prev => prev + ' ' + text);
                    setPartialTranscript('');
                    console.log(`[FINAL] ${text}`);
                } else if (data.message === 'EndOfTranscript') {
                    console.log('[END] End of transcript received');
                } else if (data.message === 'Error') {
                    console.error('[ERROR] Speechmatics error:', data.error);
                    console.error('[ERROR] Full error data:', JSON.stringify(data));
                    setError(data.error || 'Unknown error occurred');
                } else if (data.message === 'Warning') {
                    console.warn('[WARNING] Speechmatics warning:', data);
                } else {
                    console.log('[INFO] Speechmatics message:', data.message, data);
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
                setError('Connection error: ' + (error.message || 'Unknown error'));
            });

            // Get JWT token
            const jwt = await fetchJWT(apiKey);

            // Start the client with JWT
            await clientRef.current.start(jwt, {
                transcription_config: {
                    language: 'en',
                    enable_partials: true,
                },
                audio_format: {
                    type: 'raw',
                    encoding: 'pcm_f32le',
                    sample_rate: AUDIO_SAMPLE_RATE
                }
            });

            console.log('[CONFIG] Speechmatics started with sample rate:', AUDIO_SAMPLE_RATE);

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
        const LOG_INTERVAL = 2000; // Log every 2 seconds

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
                        // Count non-silent samples
                        const nonSilentSamples = boostedData.filter(x => Math.abs(x) > 0.01).length;
                        const percentAudible = (nonSilentSamples / boostedData.length * 100).toFixed(1);

                        console.log(`[AUDIO STATS] Packets: ${packetCount}, Samples: ${audioSampleCount}, ` +
                            `RMS: ${rms.toFixed(4)}, dB: ${dbFS.toFixed(1)} dBFS, ` +
                            `Audible: ${percentAudible}%, Has audio: ${hasAudio}`);

                        lastLogTime = now;
                        packetCount = 0;
                        audioSampleCount = 0;
                    }

                    // Handle consecutive silence detection
                    if (!hasAudio) {
                        silenceCountRef.current++;

                        // If too many consecutive silence frames, send one and then skip some
                        if (silenceCountRef.current > 30) { // about 600ms of silence
                            if (silenceCountRef.current % 5 !== 0) { // Send every 5th silent frame
                                if (sendResponse) sendResponse({ success: true });
                                return true;
                            }
                        }
                    } else {
                        silenceCountRef.current = 0;
                    }

                    // Strong audio detection logging
                    if (hasAudio && rms > 0.05) {
                        console.log(`[AUDIO DETECTED] Strong audio signal: ${rms.toFixed(4)}, dB: ${dbFS.toFixed(1)}`);
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
            stopListening();
        };
    }, []);

    return {
        isListening,
        transcript,
        partialTranscript,
        error,
        audioLevel,
        startListening,
        stopListening
    };
}; 