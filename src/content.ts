/// <reference path="./chrome.d.ts" />

console.log("Content script loaded!");

function isYouTubePage() {
  return window.location.hostname.includes("youtube.com");
}

function handleYouTubeVideo() {
  const movie_player = document.getElementById("movie_player");
  if (!movie_player || movie_player.hasAttribute("data-subway-video-added"))
    return;

  // Create our fullscreen container
  const fullscreenContainer = document.createElement("div");
  fullscreenContainer.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: black;
        z-index: 9999999;
    `;

  // Create container for embedded player
  const playerContainer = document.createElement("div");
  playerContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 75%;
        height: 100%;
    `;

  // Create subway video container
  const subwayContainer = document.createElement("div");
  subwayContainer.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        width: 25%;
        height: 100%;
    `;

  const subwayVideo = document.createElement("video");
  subwayVideo.src = chrome.runtime.getURL("subway.mp4");
  subwayVideo.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
    `;
  subwayVideo.autoplay = true;
  subwayVideo.loop = true;
  subwayVideo.muted = true;
  subwayVideo.playsInline = true;

  // Assemble the containers
  subwayContainer.appendChild(subwayVideo);
  fullscreenContainer.appendChild(playerContainer);
  fullscreenContainer.appendChild(subwayContainer);
  document.body.appendChild(fullscreenContainer);

  // Function to get current video details
  function getVideoDetails() {
    const video = document.querySelector("video");
    const videoId = new URLSearchParams(window.location.search).get("v");
    return {
      currentTime: video ? video.currentTime : 0,
      videoId: videoId,
      playing: !video?.paused,
      originalVideo: video,
    };
  }

  // Function to create embedded player
  function createEmbeddedPlayer(videoDetails: {
    currentTime: number;
    videoId: string | null;
    playing: boolean;
    originalVideo: HTMLVideoElement | null;
  }) {
    const embed = document.createElement("iframe");
    embed.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;

    // Create YouTube embed URL with current timestamp
    const startTime = Math.floor(videoDetails.currentTime);
    embed.src = `https://www.youtube.com/embed/${videoDetails.videoId}?autoplay=1&start=${startTime}&enablejsapi=1`;

    return embed;
  }

  // Handle fullscreen changes
  function handleFullscreenRequest(e: Event) {
    // Prevent default fullscreen behavior
    e.preventDefault();
    e.stopPropagation();

    const videoDetails = getVideoDetails();

    // Pause the original video
    if (videoDetails.originalVideo) {
      videoDetails.originalVideo.pause();
    }

    // Clear previous iframe if it exists
    playerContainer.innerHTML = "";

    // Create new embedded player
    const embed = createEmbeddedPlayer(videoDetails);
    playerContainer.appendChild(embed);

    // Show our container and make it fullscreen
    fullscreenContainer.style.display = "block";
    fullscreenContainer
      .requestFullscreen()
      .catch((e) => console.log("Fullscreen error:", e));

    // Ensure subway video is playing
    subwayVideo
      .play()
      .catch((e) => console.log("Error playing subway video:", e));
  }

  // Handle exiting fullscreen
  function handleFullscreenExit() {
    if (!document.fullscreenElement) {
      fullscreenContainer.style.display = "none";
      playerContainer.innerHTML = ""; // Remove embed

      // Resume original video if it was playing before
      const video = document.querySelector("video");
      if (video) {
        video.play().catch((e) => console.log("Error resuming video:", e));
      }
    }
  }

  // Listen for fullscreen button clicks
  const fullscreenButton = movie_player.querySelector(".ytp-fullscreen-button");
  if (fullscreenButton) {
    fullscreenButton.addEventListener("click", handleFullscreenRequest);
  }

  // Listen for 'f' key press
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.altKey && !e.metaKey) {
      handleFullscreenRequest(e);
    }
  });

  // Listen for fullscreen changes
  document.addEventListener("fullscreenchange", handleFullscreenExit);

  movie_player.setAttribute("data-subway-video-added", "true");
}

function addSubwayVideo(videoElement: HTMLVideoElement) {
  if (isYouTubePage()) return; // Skip for YouTube

  if (
    videoElement.hasAttribute("data-subway-video-added") ||
    document.querySelector(".video-player-new") !== null
  ) {
    return;
  }

  let videoContainer = videoElement.parentElement;
  const originalHeight = videoElement.offsetHeight || videoElement.clientHeight;
  const containerHeight = originalHeight;
  const containerWidth = Math.floor(originalHeight * (16 / 9));

  const subwayContainer = document.createElement("div");
  subwayContainer.classList.add("subway-container");
  subwayContainer.style.width = `${containerWidth}px`;
  subwayContainer.style.height = `${containerHeight}px`;
  subwayContainer.style.overflow = "hidden";
  subwayContainer.style.flexShrink = "0";
  subwayContainer.style.display = "none";

  const subwayVideo = document.createElement("video");
  subwayVideo.src = chrome.runtime.getURL("subway.mp4");
  subwayVideo.autoplay = true;
  subwayVideo.loop = true;
  subwayVideo.muted = true;
  subwayVideo.playsInline = true;

  subwayVideo.style.width = "100%";
  subwayVideo.style.height = "100%";
  subwayVideo.style.objectFit = "cover";

  const flexContainer = document.createElement("div");

  // Determine if running inside an iframe
  const isInIframe = window !== window.top;

  function updateLayout() {
    let isFullscreen = false;

    try {
      isFullscreen = document.fullscreenElement !== null;
      if (!isFullscreen) {
        // Add JW Player specific check
        const jwPlayerContainers = document.querySelectorAll(
          ".jw-media, .jwplayer"
        );
        jwPlayerContainers.forEach((container) => {
          const rect = container.getBoundingClientRect();
          const viewportArea = window.innerWidth * window.innerHeight;
          const containerArea = rect.width * rect.height;
          if (containerArea / viewportArea > 0.9) {
            isFullscreen = true;
          }
        });

        // Keep existing checks
        const playerContainers = document.querySelectorAll(
          ".kWidgetIframeContainer, .otherPlayerClass"
        );
        playerContainers.forEach((container) => {
          const rect = container.getBoundingClientRect();
          const viewportArea = window.innerWidth * window.innerHeight;
          const containerArea = rect.width * rect.height;
          if (containerArea / viewportArea > 0.9) {
            isFullscreen = true;
          }
        });
      }
    } catch (e) {
      console.log("Fullscreen check error:", e);
    }

    if (isFullscreen) {
      // Check if it's a JW Player
      const isJWPlayer = videoElement.closest(".jw-media, .jwplayer") !== null;

      // Ensure subway video is playing when entering fullscreen
      if (subwayVideo && subwayVideo.paused) {
        subwayVideo
          .play()
          .catch((error) => console.log("Error resuming subway video:", error));
      }

      if (isJWPlayer) {
        // Find the JW Player's media container
        const jwMediaContainer = videoElement.closest(".jw-media");

        if (jwMediaContainer) {
          // Create parent wrapper for both videos
          const parentWrapper = document.createElement("div");
          parentWrapper.style.display = "flex";
          parentWrapper.style.flexDirection = "row";
          parentWrapper.style.width = "100%";
          parentWrapper.style.height = "100%";
          parentWrapper.style.position = "fixed";
          parentWrapper.style.top = "0";
          parentWrapper.style.left = "0";
          parentWrapper.style.backgroundColor = "#000";
          parentWrapper.style.zIndex = "1";

          // Set up the main video container
          jwMediaContainer.style.width = "75%";
          jwMediaContainer.style.height = "100%";
          jwMediaContainer.style.position = "relative";
          jwMediaContainer.style.flex = "0 0 75%";
          jwMediaContainer.style.zIndex = "2";

          // Enable native controls as backup
          videoElement.controls = true;

          // Set up subway container
          subwayContainer.style.width = "25%";
          subwayContainer.style.height = "100%";
          subwayContainer.style.flex = "0 0 25%";
          subwayContainer.style.position = "relative";
          subwayContainer.style.zIndex = "1";

          // Ensure subway video fills its container
          subwayVideo.style.width = "100%";
          subwayVideo.style.height = "100%";
          subwayVideo.style.objectFit = "cover";

          // Move both elements into the wrapper
          const jwParent = jwMediaContainer.parentElement;
          jwParent.insertBefore(parentWrapper, jwMediaContainer);
          parentWrapper.appendChild(jwMediaContainer);
          parentWrapper.appendChild(subwayContainer);

          // Try to ensure JW Player controls are visible
          const jwControls = jwMediaContainer
            .closest(".jwplayer")
            ?.querySelector(".jw-controls");
          if (jwControls) {
            jwControls.style.zIndex = "3";
            jwControls.style.display = "block";
          }
        }

        // Video element styles
        videoElement.style.width = "100%";
        videoElement.style.height = "100%";
        videoElement.style.maxHeight = "100vh";
        videoElement.style.objectFit = "contain";
        videoElement.style.margin = "0";
      } else {
        // Normal video setup
        // Create parent wrapper for both videos
        const parentWrapper = document.createElement("div");
        parentWrapper.style.display = "flex";
        parentWrapper.style.flexDirection = "row";
        parentWrapper.style.width = "100%";
        parentWrapper.style.height = "100%";
        parentWrapper.style.position = "fixed";
        parentWrapper.style.top = "0";
        parentWrapper.style.left = "0";
        parentWrapper.style.backgroundColor = "#000";
        parentWrapper.style.zIndex = "9999999";

        // Set up video container
        videoElement.style.width = "75%";
        videoElement.style.height = "100%";
        videoElement.style.maxHeight = "100vh";
        videoElement.style.objectFit = "contain";
        videoElement.style.flex = "0 0 75%";
        videoElement.controls = true;

        // Set up subway container
        subwayContainer.style.width = "25%";
        subwayContainer.style.height = "100%";
        subwayContainer.style.flex = "0 0 25%";
        subwayContainer.style.position = "relative";

        // Ensure subway video fills its container
        subwayVideo.style.width = "100%";
        subwayVideo.style.height = "100%";
        subwayVideo.style.objectFit = "cover";

        if (videoElement.parentElement) {
          const videoParent = videoElement.parentElement;
          videoParent.insertBefore(parentWrapper, videoElement);
          parentWrapper.appendChild(videoElement);
          parentWrapper.appendChild(subwayContainer);
        }
      }
      videoElement.style.order = "1";
      videoElement.controls = true;

      // Subway video setup
      subwayContainer.style.width = "25%";
      subwayContainer.style.height = "100%";
      subwayContainer.style.flexShrink = "0";
      subwayContainer.style.order = "2";
      subwayContainer.style.display = "block";
      subwayContainer.style.position = "relative";

      subwayVideo.style.width = "100%";
      subwayVideo.style.height = "100%";
      subwayVideo.style.objectFit = "cover";
    } else {
      // Non-fullscreen styles
      videoElement.style.width = "100%";
      videoElement.style.height = "auto";
      videoElement.style.maxWidth = "none";
      videoElement.style.maxHeight = "none";
      videoElement.style.position = "static";
      videoElement.style.flex = "none";
      videoElement.controls = false; // Disable native controls when not fullscreen

      // Remove subway container completely when exiting fullscreen
      subwayContainer.style.display = "none";
      if (subwayContainer.parentElement) {
        subwayContainer.parentElement.removeChild(subwayContainer);
      }

      // If we're in JW Player mode, clean up the wrapper but preserve the video
      const parentWrapper = document.querySelector(
        'div[style*="display: flex"][style*="position: fixed"]'
      ) as HTMLElement;
      if (parentWrapper) {
        // Move the video content back to its original position
        const videoContent = parentWrapper.querySelector(
          ".jw-media, video"
        ) as HTMLElement;
        if (videoContent) {
          parentWrapper.parentElement.insertBefore(videoContent, parentWrapper);
          // Reset video container styles
          videoContent.style.width = "100%";
          videoContent.style.height = "100%";
          videoContent.style.position = "relative";
        }
        // Remove the wrapper
        parentWrapper.parentElement.removeChild(parentWrapper);
      }
    }

    // Handle iframe resizing if needed
    if (isInIframe) {
      try {
        const totalWidth = isFullscreen
          ? window.innerWidth
          : videoElement.offsetWidth;
        const totalHeight = isFullscreen
          ? window.innerHeight
          : videoElement.offsetHeight;
        const frameElement = window.frameElement as HTMLElement;
        if (frameElement) {
          frameElement.style.width = `${totalWidth}px`;
          frameElement.style.height = `${totalHeight}px`;
        }
      } catch (e) {}
    }
  }

  // Add event listeners for both fullscreen changes and size changes
  document.addEventListener("fullscreenchange", updateLayout);
  window.addEventListener("resize", updateLayout);

  // Check periodically for size-based fullscreen
  const fullscreenCheckInterval = setInterval(updateLayout, 1000);

  videoElement.parentNode.insertBefore(flexContainer, videoElement);
  flexContainer.appendChild(videoElement);
  subwayContainer.appendChild(subwayVideo);
  flexContainer.appendChild(subwayContainer);

  // Clean up interval when video is removed
  const videoObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node === videoElement) {
          clearInterval(fullscreenCheckInterval);
          videoObserver.disconnect();
        }
      });
    });
  });

  videoObserver.observe(videoElement.parentNode, { childList: true });

  // Mark the video as having a subway video added
  videoElement.setAttribute("data-subway-video-added", "true");
}

let globalSubwayVideo: HTMLVideoElement | null = null;

// Function to inject global subway video overlay
function injectGlobalSubwayVideo() {
  if (globalSubwayVideo) return; // Already exists

  globalSubwayVideo = document.createElement("video");
  globalSubwayVideo.src = chrome.runtime.getURL("subway.mp4");
  globalSubwayVideo.autoplay = true;
  globalSubwayVideo.loop = true;
  globalSubwayVideo.muted = true;
  globalSubwayVideo.playsInline = true;

  // Style adjustments to prevent full-page coverage
  globalSubwayVideo.style.position = "fixed";
  globalSubwayVideo.style.top = "10px"; // Adjust as needed
  globalSubwayVideo.style.right = "10px"; // Adjust as needed
  globalSubwayVideo.style.width = "200px"; // Adjust as needed
  globalSubwayVideo.style.height = "auto";
  globalSubwayVideo.style.zIndex = "1000000"; // High z-index to overlay
  globalSubwayVideo.style.pointerEvents = "none"; // Allow clicks to pass through

  document.body.appendChild(globalSubwayVideo);
}

// Function to remove global subway video overlay
function removeGlobalSubwayVideo() {
  if (globalSubwayVideo) {
    globalSubwayVideo.remove();
    globalSubwayVideo = null;
  }
}

// Function to remove local subway videos
function removeSubwayVideo() {
  // Remove all subway containers by class
  const subwayContainers = document.querySelectorAll(".subway-container");
  subwayContainers.forEach((container) => container.remove());
}

// Function to inject global subway video when entering fullscreen
function handleFullscreenEnter(fullscreenElement: Element) {
  console.log("Entering fullscreen:", fullscreenElement);
  if (fullscreenElement.tagName === "VIDEO") {
    addSubwayVideo(fullscreenElement as HTMLVideoElement);
  } else if (fullscreenElement.tagName === "IFRAME") {
    try {
      const iframeDoc =
        (fullscreenElement as HTMLIFrameElement).contentDocument ||
        (fullscreenElement as HTMLIFrameElement).contentWindow.document;
      const videoEl = iframeDoc.querySelector("video");
      if (videoEl) {
        addSubwayVideo(videoEl);
      }
    } catch (e) {
      console.log(
        "Cross-origin iframe detected. Injecting global subway video."
      );
      // Cross-origin iframe, inject global subway video
      injectGlobalSubwayVideo();
    }
  } else {
    // Non-video fullscreen element, inject global subway video
    injectGlobalSubwayVideo();
  }
}

// Function to remove subway videos when exiting fullscreen
function handleFullscreenExit() {
  console.log("Exiting fullscreen.");
  removeSubwayVideo();
  removeGlobalSubwayVideo();
}

// Add fullscreen change listener
document.addEventListener("fullscreenchange", () => {
  const fullscreenElement = document.fullscreenElement;
  if (fullscreenElement) {
    handleFullscreenEnter(fullscreenElement);
  } else {
    handleFullscreenExit();
  }
});

// Ensure subway videos are not duplicated on initial load
window.addEventListener("load", () => {
  console.log("Page loaded.");
  // Optional: Initialize or clean up subway videos on page load
});

function observeDOM() {
  if (isYouTubePage()) {
    // For YouTube, we'll use a different approach
    const checkForYouTubePlayer = setInterval(() => {
      if (document.getElementById("movie_player")) {
        handleYouTubeVideo();
        clearInterval(checkForYouTubePlayer);
      }
    }, 1000);

    // Clear interval after 10 seconds if player isn't found
    setTimeout(() => clearInterval(checkForYouTubePlayer), 10000);
    return;
  }

  function processNode(node: Node) {
    if (
      node.nodeName === "VIDEO" ||
      (node.nodeName === "DIV" &&
        (node as Element).classList.contains("mwEmbedPlayer")) ||
      (node.nodeName === "VIDEO" &&
        (node as Element).classList.contains("persistentNativePlayer")) ||
      (node.nodeName === "IFRAME" &&
        (node as Element).classList.contains("mwEmbedKalturaIframe"))
    ) {
      let videoEl: HTMLVideoElement | null = null;

      if (node.nodeName === "VIDEO") {
        videoEl = node as HTMLVideoElement;
      } else if (node.nodeName === "DIV" || node.nodeName === "IFRAME") {
        try {
          // Attempt to access video within iframe
          if (node.nodeName === "IFRAME") {
            const iframeDoc =
              (node as HTMLIFrameElement).contentDocument ||
              (node as HTMLIFrameElement).contentWindow.document;
            videoEl = iframeDoc.querySelector("video");
          } else {
            videoEl = (node as Element).querySelector("video");
          }
        } catch (e) {
          console.log("Cannot access iframe content due to same-origin policy");
        }
      }

      if (videoEl) {
        addSubwayVideo(videoEl);
      } else {
        const checkInterval = setInterval(() => {
          try {
            if (node.nodeName === "IFRAME") {
              const iframeDoc =
                (node as HTMLIFrameElement).contentDocument ||
                (node as HTMLIFrameElement).contentWindow.document;
              videoEl = iframeDoc.querySelector("video");
            } else {
              videoEl = (node as Element).querySelector("video");
            }

            if (videoEl) {
              clearInterval(checkInterval);
              addSubwayVideo(videoEl);
            }
          } catch (e) {
            // Still cannot access iframe content
          }
        }, 500);

        // Clear interval after 10 seconds to prevent infinite checking
        setTimeout(() => clearInterval(checkInterval), 10000);
      }
    }
  }

  const observerConfig = {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "class"],
  };

  function setupObserver(target: Node) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach(processNode);
        } else if (mutation.type === "attributes") {
          processNode(mutation.target);
        }
      });
    });

    observer.observe(target, observerConfig);
  }

  document.querySelectorAll("video, .mwEmbedPlayer").forEach(processNode);

  document.querySelectorAll("iframe").forEach((iframe) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.querySelectorAll("video, .mwEmbedPlayer").forEach(processNode);
      setupObserver(iframeDoc.body);
    } catch (e) {
      console.log("Cannot access iframe content due to same-origin policy");
    }
  });

  setupObserver(document.body);
}

// Initialize DOM observation
observeDOM();
