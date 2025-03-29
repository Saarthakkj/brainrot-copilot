// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.target === 'offscreen') {
    switch (message.type) {
      case 'start-recording':
        startRecording(message.data);
        if (sendResponse) sendResponse({ success: true });
        break;
      case 'stop-recording':
        stopRecording();
        if (sendResponse) sendResponse({ success: true });
        break;
      case 'get-audio-stream':
        // Return current stream ID if recording is active
        if (recorder?.state === 'recording' && message.tabId) {
          sendAudioStream(message.tabId);
          if (sendResponse) sendResponse({ success: true });
        } else {
          if (sendResponse) sendResponse({ success: false, error: 'No active recording' });
        }
        break;
      case 'enable-transcription':
        enableTranscription = message.enable;
        activeTabId = message.tabId || activeTabId;
        if (sendResponse) sendResponse({ success: true });
        break;
      default:
        console.error('Unrecognized message:', message.type);
        if (sendResponse) sendResponse({ success: false, error: 'Unrecognized message type' });
    }
  }
  return true; // Keep the message channel open for async response
});

let recorder;
let data = [];
let audioContext;
let analyser;
let animationFrameId;
let audioWorklet;
let enableTranscription = false;
let activeTabId;
const BUFFER_SIZE = 4096;
const SAMPLE_RATE = 48000; // Explicitly set sample rate to match Speechmatics config

// Audio processor worklet for handling audio data
const workletCode = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.enableTranscription = false;
  }

  process(inputs, outputs, parameters) {
    // Check if we have inputs and if transcription is enabled
    if (inputs[0] && inputs[0][0] && this.enableTranscription) {
      // Send audio data back to the main thread
      this.port.postMessage({
        audioData: inputs[0][0]
      });
    }
    
    // Pass through audio data unchanged
    if (inputs[0] && outputs[0]) {
      for (let channel = 0; channel < outputs[0].length; ++channel) {
        if (inputs[0][channel] && outputs[0][channel]) {
          outputs[0][channel].set(inputs[0][channel]);
        }
      }
    }
    
    return true; // Keep the processor running
  }
}

registerProcessor('audio-processor', AudioProcessor);
`;

async function startRecording(streamId) {
  if (recorder?.state === 'recording') {
    throw new Error('Called startRecording while recording is in progress.');
  }

  // Chrome requires these specific constraints for tab capture
  const media = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    },
    video: false  // Explicitly disable video to focus on audio
  });

  // Set up audio context and analyzer with our desired sample rate
  audioContext = new AudioContext({
    sampleRate: SAMPLE_RATE,
    latencyHint: 'interactive'
  });
  console.log('[AUDIO] Audio context created with sample rate:', audioContext.sampleRate);

  const source = audioContext.createMediaStreamSource(media);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  // IMPORTANT: Connect the source directly to destination to hear audio
  // Comment this out if you don't want to hear the audio
  source.connect(audioContext.destination);

  // Skip AudioWorklet and use the direct processing method
  // This avoids CSP issues with blob URLs
  handleAudioProcessing(source);

  // Start audio visualization
  startVisualization();

  // Start recording.
  recorder = new MediaRecorder(media, { mimeType: 'audio/webm' });
  recorder.ondataavailable = (event) => data.push(event.data);
  recorder.onstop = () => {
    // Clear state ready for next recording
    recorder = undefined;
    data = [];
  };
  recorder.start();

  console.log('[AUDIO] Recording started successfully');

  // Record the current state in the URL
  window.location.hash = 'recording';
}

// Fallback for browsers that don't support AudioWorklet
function handleAudioProcessing(source) {
  // Create an AnalyserNode to sample audio data
  const tmpAnalyser = audioContext.createAnalyser();
  tmpAnalyser.fftSize = 2 * BUFFER_SIZE;
  source.connect(tmpAnalyser);

  // Create a gain node to boost the audio level
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 5.0; // Higher gain to increase sensitivity
  source.connect(gainNode);

  const dataArray = new Float32Array(BUFFER_SIZE);

  // For audio level logging
  let sampleCounter = 0;
  let maxLevel = 0;
  const LOG_INTERVAL = 50; // Log more frequently (every 50 samples)
  let lastSendTime = Date.now();
  const SEND_INTERVAL = 100; // Send level updates every 100ms

  // Schedule periodic sampling and sending of audio data
  function processAudio() {
    if (!audioContext) return; // Exit if audio context is closed

    // Get time domain data
    tmpAnalyser.getFloatTimeDomainData(dataArray);

    // Calculate audio levels for logging
    sampleCounter++;
    const rms = Math.sqrt(dataArray.reduce((sum, x) => sum + x * x, 0) / dataArray.length);
    const dbFS = 20 * Math.log10(rms || 0.0000001); // Convert to dB, avoid log(0)
    maxLevel = Math.max(maxLevel, rms);

    // Always send audio level updates at regular intervals
    const now = Date.now();
    if (now - lastSendTime > SEND_INTERVAL) {
      lastSendTime = now;

      // Calculate normalized level (0-100)
      const level = Math.min(100, rms * 200); // Increased sensitivity

      // Send level update to service worker
      chrome.runtime.sendMessage({
        type: 'audio-level',
        level: level
      });

      // Send to specific tab if transcription is enabled
      if (enableTranscription && activeTabId) {
        chrome.runtime.sendMessage({
          type: 'forward-audio-level',
          tabId: activeTabId,
          level: level
        });
      }
    }

    // Log audio levels periodically
    if (sampleCounter % LOG_INTERVAL === 0) {
      console.log(`[AUDIO LEVELS] RMS: ${rms.toFixed(4)}, dB: ${dbFS.toFixed(1)} dBFS, Max: ${maxLevel.toFixed(4)}`);
      maxLevel = 0; // Reset max for next interval
    }

    // Boost the audio data to make it more sensitive
    const boostedData = new Float32Array(dataArray.length);
    for (let i = 0; i < dataArray.length; i++) {
      // Apply a higher gain to boost sensitivity (clamping to -1 to 1 range)
      boostedData[i] = Math.max(-1, Math.min(1, dataArray[i] * 4.0));
    }

    // Check if the audio has any content (not just silence)
    const hasAudio = boostedData.some(sample => Math.abs(sample) > 0.01);

    // Log when we find significant audio
    if (hasAudio && rms > 0.03) {
      console.log(`[AUDIO DETECTED] Audio signal detected: ${rms.toFixed(4)}`);
    }

    // Always send audio data when transcription is enabled
    if (enableTranscription && activeTabId) {
      // Only send data periodically to avoid overloading
      if (hasAudio || Math.random() < 0.1) { // Send all non-silent frames plus 10% of silent ones
        chrome.runtime.sendMessage({
          type: 'forward-audio-data',
          tabId: activeTabId,
          data: Array.from(boostedData) // Convert to regular array for message passing
        }, (response) => {
          if (response && !response.success) {
            console.error('[AUDIO] Error forwarding audio data:', response.error);
          }
        });
      }
    }

    // Schedule next processing - use a shorter interval for more frequent updates
    setTimeout(processAudio, 20);
  }

  // Start processing immediately
  processAudio();
  console.log('[AUDIO] Audio processing started');
}

async function stopRecording() {
  // Disable transcription
  enableTranscription = false;

  // Stop recorder
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
  }

  // Stop audio visualization
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // Disconnect and clean up audio worklet
  if (audioWorklet) {
    audioWorklet.disconnect();
    audioWorklet = null;
  }

  // Clean up audio context
  if (audioContext) {
    await audioContext.close();
    audioContext = null;
  }

  // Stopping the tracks makes sure the recording icon in the tab is removed.
  if (recorder && recorder.stream) {
    recorder.stream.getTracks().forEach((t) => t.stop());
  }

  // Update current state in URL
  window.location.hash = '';
}

// Send audio stream to a tab for transcription
function sendAudioStream(tabId) {
  if (!tabId || !recorder || recorder.state !== 'recording') {
    console.error('[AUDIO] Cannot send audio stream - recording not active or invalid tab ID');
    return;
  }

  console.log('[AUDIO] Setting up audio stream for tab ID:', tabId);

  // Enable transcription mode
  enableTranscription = true;
  activeTabId = tabId;

  // Notify the worklet if available
  if (audioWorklet && audioWorklet.port) {
    audioWorklet.port.postMessage({ enableTranscription: true });
  }

  // Send an immediate level update to establish connection
  chrome.runtime.sendMessage({
    type: 'forward-audio-level',
    tabId: activeTabId,
    level: 0 // Initial level
  });
}

function startVisualization() {
  if (!analyser) return;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  let lastLevel = 0;

  function updateVisualization() {
    if (!analyser) return;

    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    const level = Math.min(100, (average / 256) * 100);

    // Only log significant changes to reduce noise
    if (Math.abs(level - lastLevel) > 5) {
      console.log(`[OFFSCREEN] Audio level: ${level.toFixed(1)}%`);
      lastLevel = level;
    }

    // Send the audio level to the service worker
    chrome.runtime.sendMessage({
      type: 'audio-level',
      level: level
    });

    // If we have an active tab for transcription, send the level via service worker
    if (enableTranscription && activeTabId) {
      chrome.runtime.sendMessage({
        type: 'forward-audio-level',
        tabId: activeTabId,
        level: level
      });

      // Directly try sending to tab as a backup (this might not work due to permissions)
      try {
        chrome.tabs.sendMessage(activeTabId, {
          type: 'audio-level',
          level: level
        });
      } catch (e) {
        // This might fail, but that's okay - the service worker approach should work
      }
    }

    animationFrameId = requestAnimationFrame(updateVisualization);
  }

  updateVisualization();
}
