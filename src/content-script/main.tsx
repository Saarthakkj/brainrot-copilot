import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { OverlayManager } from "./overlay";

// Create a container for our React app
const container = document.createElement("div");
container.id = "chrome-extension-root";
document.body.appendChild(container);

// Create a stateful App component to manage visibility
// eslint-disable-next-line react-refresh/only-export-components
const App = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for messages from the service worker
    const handleMessage = (message: { type: string }) => {
      if (message.type === "toggle-overlay") {
        setIsVisible((prev) => !prev);
        console.log("Toggling overlay visibility", !isVisible);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [isVisible]);

  // Only render the OverlayManager when visible
  return isVisible ? <OverlayManager /> : null;
};

// Create a root and render our app
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
