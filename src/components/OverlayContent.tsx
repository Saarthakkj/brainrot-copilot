import React from "react";

interface OverlayContentProps {
  onClose: () => void;
  audioStatus?: string;
  onRetry?: () => void;
}

export const OverlayContent: React.FC<OverlayContentProps> = ({
  onClose,
  audioStatus = "Initializing...",
  onRetry,
}) => {
  const isError = audioStatus.toLowerCase().includes("error");
  const isConnected = audioStatus.includes("Audio stream connected");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "5px 20px",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          height: "28px",
          background: "rgba(0,0,0,0.5)",
        }}
      >
        <div>2:03</div>
        <div style={{ display: "flex", gap: "5px" }}>
          <span>📶</span>
          <span>📡</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          color: "white",
        }}
      >
        {/* Audio App Title */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          Tab Audio Monitor
        </div>

        {/* Audio Visualizer Container */}
        <div
          style={{
            width: "80%",
            height: "150px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "15px",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              color: "#0d84fc",
              fontWeight: "bold",
            }}
          >
            Audio Level
          </div>
          <div
            id="audio-meter"
            style={{
              flex: 1,
              background: "rgba(13,132,252,0.1)",
              borderRadius: "10px",
              overflow: "hidden",
              position: "relative",
            }}
          />
        </div>

        {/* Audio Status */}
        <div
          style={{
            marginTop: "20px",
            fontSize: "14px",
            color: isError ? "#ff4444" : "#666",
            textAlign: "center",
          }}
        >
          {audioStatus}
        </div>

        {/* Start/Retry Button (shown when not connected) */}
        {!isConnected && onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: "15px",
              padding: "8px 20px",
              background: isError ? "#ff4444" : "#0d84fc",
              border: "none",
              borderRadius: "20px",
              color: "white",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = isError
                ? "#ff2222"
                : "#0a6cd0";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = isError
                ? "#ff4444"
                : "#0d84fc";
            }}
          >
            {isError ? "Try Again" : "Start Audio Capture"}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        className="close-button"
        onClick={onClose}
        style={{
          position: "absolute",
          top: "35px",
          right: "15px",
          background: "rgba(255,255,255,0.1)",
          border: "none",
          fontSize: "16px",
          fontWeight: "bold",
          color: "white",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: "50%",
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2147483649,
        }}
      >
        ×
      </button>

      {/* Home indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "30%",
          height: "5px",
          background: "rgba(255,255,255,0.5)",
          borderRadius: "3px",
        }}
      />
    </div>
  );
};
