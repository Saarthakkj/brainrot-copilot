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

let activeTab = null;
let overlayActive = false;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ping') {
    // Ping response to check if service worker is active
    sendResponse({ status: 'ok' });
    return true;
  }
  
  // All other audio-related message handling has been removed as it's no longer needed
});

// Handle clicks on the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  try {
    activeTab = tab;
    const hasPermission = await checkPermission();
    
    if (hasPermission) {
      toggleOverlay();
    } else {
      // Request permissions if needed
      chrome.permissions.request({
        permissions: ['scripting', 'activeTab']
      }, (granted) => {
        if (granted) {
          toggleOverlay();
        }
      });
    }
  } catch (error) {
    console.error('Error handling action click:', error);
  }
});

// Check if we have the necessary permissions
async function checkPermission() {
  return chrome.permissions.contains({
    permissions: ['scripting', 'activeTab']
  });
}

// Toggle overlay visibility
async function toggleOverlay() {
  try {
    // Check if content script is already injected by sending a ping
    let contentScriptActive = false;
    try {
      const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'ping' });
      contentScriptActive = response && response.status === 'ok';
    } catch (error) {
      contentScriptActive = false;
    }

    if (!contentScriptActive) {
      // If not, inject the content script first
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content-script.js']
      });
    }

    // Toggle overlay
    overlayActive = !overlayActive;
    await chrome.tabs.sendMessage(activeTab.id, { 
      type: 'toggle-overlay', 
      show: overlayActive 
    });

    // Update icon based on state
    const iconPath = overlayActive ? 'icons/on' : 'icons/off';
    chrome.action.setIcon({
      path: {
        "16": `${iconPath}/icon16.png`,
        "32": `${iconPath}/icon32.png`,
        "48": `${iconPath}/icon48.png`,
        "128": `${iconPath}/icon128.png`
      }
    });
  } catch (error) {
    console.error('Error toggling overlay:', error);
  }
}
