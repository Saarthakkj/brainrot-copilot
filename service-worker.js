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

// Listen for messages from content script and offscreen document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'stop-recording') {
    chrome.runtime.getContexts({}).then(existingContexts => {
      const offscreenDocument = existingContexts.find(
        (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
      );

      if (offscreenDocument) {
        chrome.runtime.sendMessage({
          type: 'stop-recording',
          target: 'offscreen'
        });
        chrome.action.setIcon({ path: 'icons/not-recording.png' });
      }
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  } else if (message.type === 'get-audio-stream' && message.target === 'background') {
    // console.log('[SERVICE] Received request for audio stream from tab:', sender.tab?.id); // VERBOSE
    // Forward the request to the offscreen document with the tab ID
    chrome.runtime.getContexts({}).then(existingContexts => {
      const offscreenDocument = existingContexts.find(
        (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
      );

      if (offscreenDocument && offscreenDocument.documentUrl.endsWith('#recording')) {
        // console.log('[SERVICE] Forwarding audio stream request to offscreen document for tab:', sender.tab?.id); // VERBOSE
        chrome.runtime.sendMessage({
          type: 'get-audio-stream',
          target: 'offscreen',
          tabId: sender.tab?.id
        }, (response) => {
          // console.log('[SERVICE] Offscreen document response:', response); // DEBUG
          sendResponse(response);
        });
      } else {
        console.warn('[SERVICE] No active recording found for audio stream request');
        sendResponse({ success: false, error: 'No active recording' });
      }
    });
    return true; // Keep the message channel open for async response
  } else if (message.type === 'enable-transcription') {
    // Forward enable/disable transcription request to offscreen document
    // console.log('[SERVICE] Forwarding transcription ' + (message.enable ? 'enable' : 'disable') + ' request'); // VERBOSE
    chrome.runtime.getContexts({}).then(existingContexts => {
      const offscreenDocument = existingContexts.find(
        (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
      );

      if (offscreenDocument && offscreenDocument.documentUrl.endsWith('#recording')) {
        chrome.runtime.sendMessage({
          type: 'enable-transcription',
          target: 'offscreen',
          enable: message.enable,
          tabId: sender.tab ? sender.tab.id : null
        }, (response) => {
          sendResponse(response);
        });
      } else {
        // Create an offscreen document if one doesn't exist
        chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['USER_MEDIA'],
          justification: 'Recording from chrome.tabCapture API'
        }).then(() => {
          // Wait a moment for offscreen document to initialize
          setTimeout(() => {
            // Get a MediaStream for the active tab
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
              if (tabs[0]) {
                try {
                  const streamId = await chrome.tabCapture.getMediaStreamId({
                    targetTabId: tabs[0].id
                  });

                  // Start recording in the offscreen document
                  chrome.runtime.sendMessage({
                    type: 'start-recording',
                    target: 'offscreen',
                    data: streamId
                  }, () => {
                    // Now enable transcription
                    chrome.runtime.sendMessage({
                      type: 'enable-transcription',
                      target: 'offscreen',
                      enable: message.enable,
                      tabId: sender.tab ? sender.tab.id : null
                    }, (response) => {
                      sendResponse(response || { success: true });
                    });
                  });
                } catch (err) {
                  console.error('[SERVICE] Error getting media stream:', err);
                  sendResponse({ success: false, error: 'Failed to get media stream: ' + err.message });
                }
              } else {
                sendResponse({ success: false, error: 'No active tab found' });
              }
            });
          }, 500);
        }).catch(err => {
          console.error('[SERVICE] Error creating offscreen document:', err);
          sendResponse({ success: false, error: 'Failed to create offscreen document: ' + err.message });
        });
      }
    });
    return true; // Keep the message channel open for async response
  } else if (message.type === 'forward-audio-data' && message.tabId) {
    // Forward audio data from offscreen document to content script
    try {
      chrome.tabs.sendMessage(message.tabId, {
        type: 'audio-data',
        data: message.data
      }, (response) => {
        if (chrome.runtime.lastError) {
          // Don't log this routinely, only if it causes problems
          // console.warn('[SERVICE] Error forwarding audio data:', chrome.runtime.lastError);
        }
        if (sendResponse) sendResponse(response || { success: true });
      });
    } catch (error) {
      console.error('[SERVICE] Error forwarding audio data:', error);
      if (sendResponse) sendResponse({ success: false, error: error.message });
    }
    return true; // Keep the message channel open for async response
  } else if (message.type === 'forward-audio-level' && message.tabId) {
    // Forward audio level from offscreen document to content script
    try {
      chrome.tabs.sendMessage(message.tabId, {
        type: 'audio-level',
        level: message.level
      }, (response) => {
        if (chrome.runtime.lastError) {
          // Ignore this error, it happens if the content script isn't ready
          // console.warn('[SERVICE] Error forwarding audio level:', chrome.runtime.lastError);
        }
        if (sendResponse) sendResponse({ success: true });
      });
    } catch (error) {
      console.error('[SERVICE] Error forwarding audio level:', error);
      if (sendResponse) sendResponse({ success: false, error: error.message });
    }
    return true; // Keep the message channel open for async response
  } else if (message.type === 'audio-level') {
    // This is the direct message from the offscreen document
    // No need to log each level update
    if (sendResponse) sendResponse({ success: true });
    return true;
  }
  return true; // Keep the message channel open for any async response
});

chrome.action.onClicked.addListener(async (tab) => {
  const existingContexts = await chrome.runtime.getContexts({});
  let recording = false;

  const offscreenDocument = existingContexts.find(
    (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
  );

  // If an offscreen document is not already open, create one.
  if (!offscreenDocument) {
    console.log('[SERVICE] Creating new offscreen document for tab:', tab.id);
    // Create an offscreen document.
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Recording from chrome.tabCapture API'
    });
  } else {
    recording = offscreenDocument.documentUrl.endsWith('#recording');
    // console.log('[SERVICE] Offscreen document already exists, recording state:', recording); // VERBOSE
  }

  if (recording) {
    console.log('[SERVICE] Stopping recording for tab:', tab.id);
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen'
    });
    chrome.action.setIcon({ path: 'icons/not-recording.png' });

    // Hide the overlay
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'toggle-overlay', show: false });
    } catch (error) {
      // console.log('[SERVICE] Content script not ready, injecting it now...'); // VERBOSE
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['dist/content.js']
      });
      await chrome.tabs.sendMessage(tab.id, { type: 'toggle-overlay', show: false });
    }
    return;
  }

  console.log('[SERVICE] Starting recording for tab:', tab.id);

  // Get a MediaStream for the active tab.
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id
  });

  // Ensure content script is injected
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'ping' });
    // console.log('[SERVICE] Content script is ready'); // VERBOSE
  } catch (error) {
    console.log('[SERVICE] Content script not ready, injecting it now...');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['dist/content.js']
    });
  }

  // Send the stream ID to the offscreen document to start recording.
  chrome.runtime.sendMessage({
    type: 'start-recording',
    target: 'offscreen',
    data: streamId
  }, (response) => {
    // console.log('[SERVICE] Recording started response:', response); // DEBUG
  });

  chrome.action.setIcon({ path: '/icons/recording.png' });

  // Show the overlay
  await chrome.tabs.sendMessage(tab.id, { type: 'toggle-overlay', show: true });
});
