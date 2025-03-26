import { overlayState } from "./overlay";

let documentObserver: MutationObserver | null = null;

export function watchForFullscreenChanges(): void {
  // Set up event listeners for fullscreen changes
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  document.addEventListener("MSFullscreenChange", handleFullscreenChange);

  // Watch for changes to the DOM that might create new fullscreen elements
  if (!documentObserver) {
    documentObserver = new MutationObserver((mutations) => {
      const fullscreenElement = getFullscreenElement();
      if (fullscreenElement) {
        ensureOverlayInContainer(fullscreenElement);
      }

      // Also check for custom fullscreen implementations using CSS
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          const target = mutation.target as HTMLElement;
          if (isCustomFullscreenElement(target)) {
            ensureOverlayInContainer(target);
          }
        }
      }
    });

    documentObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }
}

export function cleanupFullscreenHandlers(): void {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  document.removeEventListener(
    "webkitfullscreenchange",
    handleFullscreenChange
  );
  document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
  document.removeEventListener("MSFullscreenChange", handleFullscreenChange);

  if (documentObserver) {
    documentObserver.disconnect();
    documentObserver = null;
  }
}

function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

function isCustomFullscreenElement(element: HTMLElement): boolean {
  return (
    element.style.position === "fixed" &&
    element.style.top === "0px" &&
    element.style.left === "0px" &&
    element.style.width === "100%" &&
    element.style.height === "100%" &&
    element.style.zIndex &&
    parseInt(element.style.zIndex) > 1000
  );
}

function handleFullscreenChange(): void {
  const fullscreenElement = getFullscreenElement();

  if (fullscreenElement && overlayState.visible && overlayState.element) {
    ensureOverlayInContainer(fullscreenElement);
  } else if (
    !fullscreenElement &&
    overlayState.visible &&
    overlayState.element
  ) {
    // If exiting fullscreen, move overlay back to body if it's not there
    if (overlayState.element.parentElement !== document.body) {
      document.body.appendChild(overlayState.element);
    }
  }
}

function ensureOverlayInContainer(container: Element): void {
  if (!overlayState.element || !overlayState.visible) return;

  // Move the overlay to the fullscreen container if needed
  if (overlayState.element.parentElement !== container) {
    container.appendChild(overlayState.element);

    // Ensure the overlay is visible and properly styled
    overlayState.element.style.position = "fixed";
    overlayState.element.style.zIndex = "2147483647";
    overlayState.element.style.pointerEvents = "auto";
  }
}
