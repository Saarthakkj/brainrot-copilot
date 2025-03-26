import React from "react";
import { createRoot } from "react-dom/client";
import { OverlayManager } from "../overlay";

// Create a container for our React app
const container = document.createElement("div");
container.id = "chrome-extension-root";
document.body.appendChild(container);

// Create a root and render our app
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <OverlayManager />
  </React.StrictMode>
);
