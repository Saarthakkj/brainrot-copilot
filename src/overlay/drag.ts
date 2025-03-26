import { DragState } from "../types/overlay";

export function setupDragHandlers(overlay: HTMLDivElement): void {
  let dragState: DragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  };

  overlay.onmousedown = (e) => {
    // Don't start dragging if clicking on controls
    if ((e.target as HTMLElement).closest(".controls-container")) {
      return;
    }

    // Initialize position with computed values to prevent teleporting
    if (
      overlay.style.right &&
      overlay.style.bottom &&
      (!overlay.style.left || !overlay.style.top)
    ) {
      const rect = overlay.getBoundingClientRect();
      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;
      overlay.style.right = "auto";
      overlay.style.bottom = "auto";
    }

    dragState.isDragging = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.startLeft = parseInt(overlay.style.left || "0");
    dragState.startTop = parseInt(overlay.style.top || "0");

    overlay.style.cursor = "grabbing";
    e.preventDefault();
    e.stopPropagation();
  };

  const mouseMoveHandler = (e: MouseEvent) => {
    if (!dragState.isDragging) return;

    const newLeft = dragState.startLeft + (e.clientX - dragState.startX);
    const newTop = dragState.startTop + (e.clientY - dragState.startY);

    overlay.style.right = "auto";
    overlay.style.bottom = "auto";
    overlay.style.left = `${newLeft}px`;
    overlay.style.top = `${newTop}px`;
    e.preventDefault();
    e.stopPropagation();
  };

  const mouseUpHandler = (e: MouseEvent) => {
    if (dragState.isDragging) {
      dragState.isDragging = false;
      overlay.style.cursor = "default";
      e.preventDefault();
      e.stopPropagation();
    }
  };

  document.addEventListener("mousemove", mouseMoveHandler, true);
  document.addEventListener("mouseup", mouseUpHandler, true);
}
