import { OverlayState, OverlayControls } from "../types/overlay";

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
  content.style.cssText = `
    width: 100%;
    height: 100%;
    overflow-y: auto;
    color: #333;
    font-size: 16px;
    line-height: 1.6;
  `;

  // Add some sample text content
  content.innerHTML = `
    <h2 style="margin-top: 0;">Welcome to Subway Mode!</h2>
    <p>This is a text overlay that maintains the same portrait-style dimensions as the video version.</p>
    <p>You can:</p>
    <ul>
      <li>Drag it around the screen</li>
      <li>Resize it using the bottom-right corner</li>
      <li>Close it using the X button</li>
      <li>Scroll through longer content</li>
    </ul>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  `;

  return content;
}

export function hideOverlay(): void {
  if (overlayState.element && overlayState.element.parentNode) {
    overlayState.element.parentNode.removeChild(overlayState.element);
    overlayState.element = null;
    overlayState.visible = false;
  }
}
