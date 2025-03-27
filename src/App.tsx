import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    // Check the current recording status
    chrome.runtime.getContexts({}, (contexts) => {
      const offscreenDocument = contexts.find(
        (c) => c.contextType === "OFFSCREEN_DOCUMENT"
      );

      if (offscreenDocument && offscreenDocument.documentUrl) {
        setRecording(offscreenDocument.documentUrl.endsWith("#recording"));
      }
    });
  }, []);

  const toggleRecording = async () => {
    // Get the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      alert("No active tab found");
      return;
    }

    // Send a message to the service worker to toggle recording
    chrome.runtime.sendMessage({
      type: "toggle-recording",
      tabId: tab.id,
    });

    setRecording(!recording);
    window.close(); // Close the popup after action
  };

  return (
    <div className="extension-popup">
      <h2>Tab Capture Recorder</h2>
      <p>Click the button to {recording ? "stop" : "start"} recording</p>
      <button
        className={recording ? "stop-recording" : "start-recording"}
        onClick={toggleRecording}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
    </div>
  );
}

export default App;
