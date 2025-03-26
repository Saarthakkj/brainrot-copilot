import { OverlayState, OverlayControls } from "../types/overlay";
import { createRoot } from "react-dom/client";
import { OverlayContent } from "./OverlayContent";

// State management
export const overlayState: OverlayState = {
  visible: false,
  element: null,
};

export function createOverlayControls(): OverlayControls {
  const controls = document.createElement("div");
  controls.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    display: flex;
    gap: 5px;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 2147483647;
    pointer-events: auto !important;
  `;

  const closeButton = document.createElement("button");
  closeButton.textContent = "✕";
  closeButton.style.cssText = `
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    pointer-events: auto !important;
  `;

  return { closeButton, muteButton: null, controlsContainer: controls };
}

export function createOverlayContainer(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = "subway-mode-overlay";
  overlay.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    height: 480px;
    z-index: 2147483647;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    resize: both;
    background: white;
    pointer-events: auto !important;
    padding: 20px;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  `;
  return overlay;
}

export function createTextContent(): HTMLDivElement {
  const content = document.createElement("div");
  content.id = "overlay-content-root";
  content.style.cssText = `
    width: 100%;
    height: 100%;
    overflow-y: auto;
  `;

  // Create React root and render the OverlayContent component
  const root = createRoot(content);
  root.render(
    <OverlayContent
      onClose={() => {
        hideOverlay();
      }}
    />
  );

  return content;
}

export function hideOverlay(): void {
  if (overlayState.element && overlayState.element.parentNode) {
    overlayState.element.parentNode.removeChild(overlayState.element);
    overlayState.element = null;
    overlayState.visible = false;
  }
}
