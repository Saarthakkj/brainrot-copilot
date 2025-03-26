export interface OverlayState {
  visible: boolean;
  element: HTMLDivElement | null;
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
}

export interface OverlayControls {
  closeButton: HTMLButtonElement;
  muteButton: HTMLButtonElement;
  controlsContainer: HTMLDivElement;
}
