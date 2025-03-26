// Chrome extension background script
console.log("Background script loaded");

let isOverlayVisible = false; // Track visibility state

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  isOverlayVisible = !isOverlayVisible; // Toggle state

  // Send message to content script to toggle visibility
  chrome.tabs.sendMessage(tab.id, {
    type: isOverlayVisible ? "SHOW_OVERLAY" : "HIDE_OVERLAY",
  });

  // If showing overlay and first time, also init capture
  if (isOverlayVisible) {
    chrome.tabs.sendMessage(tab.id, { type: "INIT_CAPTURE" });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_TAB_AUDIO") {
    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        console.error("No active tab found");
        sendResponse({ error: "No active tab found" });
        return;
      }

      try {
        // First, request the activeTab permission
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            console.log("Activating tab capture permission...");
          },
        });

        // Then get the media stream ID
        chrome.tabCapture.getMediaStreamId(
          {
            targetTabId: activeTab.id,
            consumerTabId: activeTab.id,
          },
          (streamId) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error getting stream ID:",
                chrome.runtime.lastError
              );
              sendResponse({ error: chrome.runtime.lastError.message });
              return;
            }
            console.log("Got stream ID:", streamId);
            sendResponse({ streamId });
          }
        );
      } catch (error) {
        console.error("Error:", error);
        sendResponse({ error: error.message });
      }
    });
    return true; // Required for async response
  }
});

// Keep the service worker alive in MV3
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    console.log("Port disconnected");
  });
});
