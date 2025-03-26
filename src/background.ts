// Chrome extension background script
console.log("Background script loaded");

// Handle browser action (toolbar button) clicks
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: "toggleSubwayOverlay" });
    } catch (error) {
      console.error("Error sending message to content script:", error);

      // If there was an error, the content script might not be loaded
      // Inject the content script and try again
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      // Try sending the message again after a short delay
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id!, {
            action: "toggleSubwayOverlay",
          });
        } catch (e) {
          console.error("Failed to send message after script injection:", e);
        }
      }, 100);
    }
  }
});

// Keep the service worker alive in MV3
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    console.log("Port disconnected");
  });
});
