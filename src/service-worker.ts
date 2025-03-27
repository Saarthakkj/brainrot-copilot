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

// Define types for Chrome API objects
interface ContextInfo {
  contextType: string;
  documentUrl?: string;
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return; // Exit if tab has no ID

  const existingContexts = await chrome.runtime.getContexts({});
  let recording = false;

  const offscreenDocument = existingContexts.find(
    (c: ContextInfo) => c.contextType === "OFFSCREEN_DOCUMENT"
  );

  // If an offscreen document is not already open, create one.
  if (!offscreenDocument) {
    // Create an offscreen document.
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Recording from chrome.tabCapture API",
    });
  } else {
    recording = offscreenDocument.documentUrl?.endsWith("#recording") || false;
  }

  if (recording) {
    chrome.runtime.sendMessage({
      type: "stop-recording",
      target: "offscreen",
    });
    chrome.action.setIcon({ path: "icons/not-recording.png" });
  } else {
    // Get a MediaStream for the active tab.
    // @ts-expect-error - Chrome extension API types may not be fully up-to-date
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id,
    });

    // Send the stream ID to the offscreen document to start recording.
    chrome.runtime.sendMessage({
      type: "start-recording",
      target: "offscreen",
      data: streamId,
    });

    chrome.action.setIcon({ path: "/icons/recording.png" });
  }

  // Toggle the overlay in the content script
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "toggle-overlay",
    });
  }
});
