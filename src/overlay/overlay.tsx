import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { OverlayContent } from "../components/OverlayContent";

export const OverlayManager: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mountPoint, setMountPoint] = useState<Element | null>(null);

  // Calculate dimensions based on screen height (16:9 aspect ratio)
  const height = window.innerHeight * 0.7;
  const width = height * (9 / 16); // 16:9 aspect ratio

  // Initialize mount point
  useEffect(() => {
    setMountPoint(document.body);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;

      // Create a new container for the overlay in fullscreen
      if (fullscreenElement) {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.zIndex = "2147483647";
        container.style.pointerEvents = "none";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.top = "0";
        container.style.left = "0";
        container.style.overflow = "visible";
        container.style.display = "block";
        container.style.opacity = "1";
        fullscreenElement.appendChild(container);
        setMountPoint(container);
      } else {
        setMountPoint(document.body);
      }
    };

    // Watch for custom fullscreen implementations
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          const target = mutation.target as HTMLElement;
          if (
            target.style.position === "fixed" &&
            target.style.top === "0px" &&
            target.style.left === "0px" &&
            target.style.width === "100%" &&
            target.style.height === "100%" &&
            target.style.zIndex &&
            parseInt(target.style.zIndex) > 1000
          ) {
            const container = document.createElement("div");
            container.style.position = "fixed";
            container.style.zIndex = "2147483647";
            container.style.pointerEvents = "none";
            container.style.width = "100%";
            container.style.height = "100%";
            container.style.top = "0";
            container.style.left = "0";
            container.style.overflow = "visible";
            container.style.display = "block";
            container.style.opacity = "1";
            target.appendChild(container);
            setMountPoint(container);
          }
        }
      }
    });

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
      observer.disconnect();
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest(".close-button"))
      return;
    setIsDragging(true);
    const rect = overlayRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isVisible || !mountPoint) return null;

  const overlay = (
    <div
      ref={overlayRef}
      onMouseDown={handleMouseDown}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        zIndex: 2147483647,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        width: `${width}px`,
        height: `${height}px`,
        display: "flex",
        flexDirection: "column",
        pointerEvents: "auto",
        visibility: "visible",
        color: "black",
        opacity: 1,
        overflow: "visible",
      }}
    >
      <OverlayContent onClose={() => setIsVisible(false)} />
    </div>
  );

  return createPortal(overlay, mountPoint);
};
