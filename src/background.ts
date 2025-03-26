// Chrome extension background script
console.log("Background script loaded");

// Example of using Chrome storage
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with default values when the extension is installed
  chrome.storage.local.set({
    count: 0,
    installDate: new Date().toISOString(),
  });

  console.log("Extension installed - storage initialized");
});

// Example of listening to browser events
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log(`Tab updated: ${tab.url}`);
  }
});

// Keep the service worker alive in MV3
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    console.log("Port disconnected");
  });
});
