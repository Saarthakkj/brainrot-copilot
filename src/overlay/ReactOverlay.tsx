import React from "react";
import { createRoot } from "react-dom/client";
import { OverlayContent } from "../components/OverlayContent";

export function createReactOverlay(
  container: HTMLElement,
  onClose: () => void
) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <OverlayContent onClose={onClose} />
    </React.StrictMode>
  );
  return root;
}
