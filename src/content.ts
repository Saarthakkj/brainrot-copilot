import {
  overlayState,
  createOverlayContainer,
  createOverlayControls,
  createTextContent,
  hideOverlay,
} from "./overlay/overlay.tsx";
import { setupDragHandlers } from "./overlay/drag";
import {
  watchForFullscreenChanges,
  cleanupFullscreenHandlers,
} from "./overlay/fullscreen";

console.log("Content script loaded!");

/**
 * Create a draggable, resizable text overlay
 */
function createSubwayOverlay() {
  // Don't create multiple overlays
  if (overlayState.element) {
    return;
  }

  // Create container for the overlay
  const overlay = createOverlayContainer();

  // Create text content
  const content = createTextContent();

  // Create controls
  const { closeButton, controlsContainer } = createOverlayControls();

  // Set up control button handler
  closeButton.onclick = (e) => {
    e.stopPropagation();
    hideOverlay();
    cleanupFullscreenHandlers();
  };

  // Add hover effect to show controls
  overlay.onmouseenter = () => {
    controlsContainer.style.opacity = "1";
  };
  overlay.onmouseleave = () => {
    controlsContainer.style.opacity = "0";
  };

  // Set up drag handlers
  setupDragHandlers(overlay);

  // Assemble the overlay
  controlsContainer.appendChild(closeButton);
  overlay.appendChild(content);
  overlay.appendChild(controlsContainer);

  // Add to page
  document.body.appendChild(overlay);
  overlayState.element = overlay;
  overlayState.visible = true;

  // After adding to DOM, convert positioning to left/top for consistent dragging
  const rect = overlay.getBoundingClientRect();
  overlay.style.right = "auto";
  overlay.style.bottom = "auto";
  overlay.style.left = `${rect.left}px`;
  overlay.style.top = `${rect.top}px`;

  // Watch for fullscreen changes
  watchForFullscreenChanges();
}

/**
 * Toggle the text overlay
 */
function toggleSubwayOverlay() {
  if (overlayState.visible) {
    hideOverlay();
    cleanupFullscreenHandlers();
  } else {
    createSubwayOverlay();
  }
}

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggleSubwayOverlay") {
    toggleSubwayOverlay();
  }
});
