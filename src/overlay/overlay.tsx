import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { OverlayContent } from "../components/OverlayContent";

export const OverlayManager: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioStatus, setAudioStatus] = useState<string>(
    "Click to start audio capture"
  );
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mountPoint, setMountPoint] = useState<Element | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Calculate dimensions based on iPhone proportions (19.5:9)
  const height = window.innerHeight * 0.7;
  const width = height * (9 / 19.5); // iPhone aspect ratio

  // Initialize mount point
  useEffect(() => {
    setMountPoint(document.body);

    // Listen for messages from background script
    const messageListener = (message: any) => {
      if (message.type === "INIT_CAPTURE") {
        initAudioCapture();
      } else if (message.type === "SHOW_OVERLAY") {
        setIsVisible(true);
      } else if (message.type === "HIDE_OVERLAY") {
        setIsVisible(false);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const initAudioCapture = async () => {
    try {
      console.log("Initializing audio capture...");
      setAudioStatus("Requesting tab audio...");

      // Request stream ID from background script
      chrome.runtime.sendMessage(
        { type: "GET_TAB_AUDIO" },
        async (response) => {
          console.log("Response:", response);
          if (response.error) {
            console.error("Error getting stream ID:", response.error);
            setAudioStatus(`Error: ${response.error}`);
            return;
          }

          if (!response.streamId) {
            console.error("No stream ID received");
            setAudioStatus("Error: No stream ID received");
            return;
          }

          console.log("Received stream ID:", response.streamId);
          setAudioStatus("Got stream ID, accessing media...");

          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                mandatory: {
                  chromeMediaSource: "tab",
                  chromeMediaSourceId: response.streamId,
                },
              } as MediaTrackConstraints,
            });

            console.log("Audio stream obtained:", stream);
            setAudioStatus("Audio stream connected");

            // Create audio context and connect stream
            audioContextRef.current = new AudioContext();

            // Create source from the stream
            audioSourceRef.current =
              audioContextRef.current.createMediaStreamSource(stream);

            // Create analyzer node
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            // Create a gain node to control volume
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.value = 1.0; // Full volume

            // Connect the nodes:
            // Source -> Analyzer -> Gain -> Destination
            audioSourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);

            // Start audio visualization
            visualizeAudio();
          } catch (error) {
            console.error("Error accessing media stream:", error);
            setAudioStatus(
              `Error: Failed to access media stream - ${error.message}`
            );
          }
        }
      );
    } catch (error) {
      console.error("Error capturing tab audio:", error);
      setAudioStatus("Error: " + error.message);
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateStatus = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      // Update audio level (0-100)
      setAudioLevel(Math.min(100, (average / 256) * 100));

      // Update the audio meter element directly
      const audioMeter = document.getElementById("audio-meter");
      if (audioMeter) {
        const level = Math.min(100, (average / 256) * 100);
        audioMeter.style.background = `linear-gradient(90deg, 
          #0d84fc ${level}%, 
          rgba(13,132,252,0.1) ${level}%
        )`;
      }

      requestAnimationFrame(updateStatus);
    };

    updateStatus();
  };

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

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  if (!isVisible || !mountPoint) return null;

  const overlay = (
    <div
      ref={overlayRef}
      onMouseDown={handleMouseDown}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        background: "#0d84fc",
        padding: "0",
        borderRadius: "44px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
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
        overflow: "hidden",
        border: "10px solid black",
      }}
    >
      {/* iPhone notch */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "40%",
          height: "30px",
          background: "black",
          borderBottomLeftRadius: "14px",
          borderBottomRightRadius: "14px",
          zIndex: 2147483648,
        }}
      />

      {/* Volume buttons */}
      <div
        style={{
          position: "absolute",
          left: "-12px",
          top: "100px",
          width: "4px",
          height: "50px",
          background: "#222",
          borderRadius: "2px",
          zIndex: 2147483648,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-12px",
          top: "160px",
          width: "4px",
          height: "50px",
          background: "#222",
          borderRadius: "2px",
          zIndex: 2147483648,
        }}
      />

      {/* Power button */}
      <div
        style={{
          position: "absolute",
          right: "-12px",
          top: "120px",
          width: "4px",
          height: "60px",
          background: "#222",
          borderRadius: "2px",
          zIndex: 2147483648,
        }}
      />

      <OverlayContent
        onClose={() => setIsVisible(false)}
        audioStatus={audioStatus}
        onRetry={initAudioCapture}
      />
    </div>
  );

  return createPortal(overlay, mountPoint);
};
