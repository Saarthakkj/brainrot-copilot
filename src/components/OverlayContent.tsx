import React from "react";

interface OverlayContentProps {
  onClose: () => void;
}

export const OverlayContent: React.FC<OverlayContentProps> = ({ onClose }) => {
  return (
    <>
      <button
        className="close-button"
        onClick={onClose}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "none",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
          padding: "4px",
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          visibility: "visible",
          zIndex: 2147483647,
          color: "black",
          opacity: 1,
          overflow: "visible",
          transform: "none",
          position: "relative",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px 0",
            color: "black",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          Overlay Content
        </h2>
        <p style={{ margin: 0, color: "black", fontSize: "16px" }}>
          This is your overlay content
        </p>
      </div>
    </>
  );
};
