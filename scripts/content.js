console.log('Content script loaded!');

function addSubwayVideo(videoElement) {
    if (videoElement.hasAttribute('data-subway-video-added') ||
        document.querySelector('.video-player-new') !== null) {
        return;
    }

    let videoContainer = videoElement.parentElement;
    const originalHeight = videoElement.offsetHeight || videoElement.clientHeight;
    const containerHeight = originalHeight;
    const containerWidth = Math.floor(originalHeight * (16 / 9));

    const subwayContainer = document.createElement('div');
    subwayContainer.classList.add('subway-container');
    subwayContainer.style.width = `${containerWidth}px`;
    subwayContainer.style.height = `${containerHeight}px`;
    subwayContainer.style.overflow = 'hidden';
    subwayContainer.style.flexShrink = '0';
    subwayContainer.style.display = 'none';

    const subwayVideo = document.createElement('video');
    subwayVideo.src = chrome.runtime.getURL('subway.mp4');
    subwayVideo.autoplay = true;
    subwayVideo.loop = true;
    subwayVideo.muted = true;
    subwayVideo.playsInline = true;

    subwayVideo.style.width = '100%';
    subwayVideo.style.height = '100%';
    subwayVideo.style.objectFit = 'cover';

    const flexContainer = document.createElement('div');

    // Determine if running inside an iframe
    const isInIframe = window !== window.top;

    function updateLayout() {
        let isFullscreen = false;

        try {
            isFullscreen = document.fullscreenElement !== null;
            if (!isFullscreen) {
                const jwPlayerContainers = document.querySelectorAll('.jwplayer.jw-state-idle, .jwplayer.jw-state-playing, .jwplayer.jw-state-paused');
                jwPlayerContainers.forEach(container => {
                    const rect = container.getBoundingClientRect();
                    const viewportArea = window.innerWidth * window.innerHeight;
                    const containerArea = rect.width * rect.height;
                    if (containerArea / viewportArea > 0.9) {
                        isFullscreen = true;
                    }
                });
            }
        } catch (e) {
            console.log('Fullscreen check error:', e);
        }

        if (isFullscreen) {
            // Basic container setup
            flexContainer.style.display = 'flex';
            flexContainer.style.flexDirection = 'row';
            flexContainer.style.gap = '0';
            flexContainer.style.alignItems = 'center';
            flexContainer.style.justifyContent = 'flex-start';
            flexContainer.style.width = '100%';
            flexContainer.style.height = '100vh';
            flexContainer.style.position = 'fixed';
            flexContainer.style.top = '0';
            flexContainer.style.left = '0';
            flexContainer.style.backgroundColor = 'transparent';
            flexContainer.style.zIndex = '1';

            // Main video setup - make it the dominant element
            videoElement.style.width = '75%';
            videoElement.style.height = '100%';
            videoElement.style.maxHeight = '100vh';
            videoElement.style.objectFit = 'contain';
            videoElement.style.position = 'relative';
            videoElement.style.zIndex = '2';
            videoElement.style.order = '1';

            // Subway video setup - make it secondary
            subwayContainer.style.width = '25%';
            subwayContainer.style.height = '100%';
            subwayContainer.style.position = 'relative';
            subwayContainer.style.zIndex = '1';
            subwayContainer.style.order = '2';
            subwayContainer.style.display = 'block';

            subwayVideo.style.width = '100%';
            subwayVideo.style.height = '100%';
            subwayVideo.style.objectFit = 'cover';

            // For JWPlayer, ensure the player container remains visible
            const jwPlayerContainer = videoElement.closest('.jwplayer');
            if (jwPlayerContainer) {
                jwPlayerContainer.style.width = '100%';
                jwPlayerContainer.style.height = '100vh';
                jwPlayerContainer.style.display = 'block';
                // Ensure controls remain visible
                const controls = jwPlayerContainer.querySelector('.jw-controls');
                if (controls) {
                    controls.style.zIndex = '3';
                }
            }
        } else {
            // Non-fullscreen styles
            flexContainer.style.display = 'block';
            flexContainer.style.width = 'auto';
            flexContainer.style.height = 'auto';
            flexContainer.style.position = 'static';
            flexContainer.style.backgroundColor = 'transparent';

            videoElement.style.width = '100%';
            videoElement.style.height = 'auto';
            videoElement.style.maxWidth = 'none';
            videoElement.style.maxHeight = 'none';
            videoElement.controls = false; // Disable native controls when not fullscreen

            subwayContainer.style.display = 'none';
        }

        // Handle iframe resizing if needed
        if (isInIframe) {
            try {
                const totalWidth = isFullscreen ? window.innerWidth : videoElement.offsetWidth;
                const totalHeight = isFullscreen ? window.innerHeight : videoElement.offsetHeight;
                window.frameElement.style.width = `${totalWidth}px`;
                window.frameElement.style.height = `${totalHeight}px`;
            } catch (e) { }
        }
    }

    // Add event listeners for both fullscreen changes and size changes
    document.addEventListener('fullscreenchange', updateLayout);
    window.addEventListener('resize', updateLayout);

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
    videoElement.setAttribute('data-subway-video-added', 'true');
}

let globalSubwayVideo = null;

// Function to inject global subway video overlay
function injectGlobalSubwayVideo() {
    if (globalSubwayVideo) return; // Already exists

    globalSubwayVideo = document.createElement('video');
    globalSubwayVideo.src = chrome.runtime.getURL('subway.mp4');
    globalSubwayVideo.autoplay = true;
    globalSubwayVideo.loop = true;
    globalSubwayVideo.muted = true;
    globalSubwayVideo.playsInline = true;

    // Style adjustments to prevent full-page coverage
    globalSubwayVideo.style.position = 'fixed';
    globalSubwayVideo.style.top = '10px'; // Adjust as needed
    globalSubwayVideo.style.right = '10px'; // Adjust as needed
    globalSubwayVideo.style.width = '200px'; // Adjust as needed
    globalSubwayVideo.style.height = 'auto';
    globalSubwayVideo.style.zIndex = '1000000'; // High z-index to overlay
    globalSubwayVideo.style.pointerEvents = 'none'; // Allow clicks to pass through

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
    const subwayContainers = document.querySelectorAll('.subway-container');
    subwayContainers.forEach(container => container.remove());
}

// Function to inject global subway video when entering fullscreen
function handleFullscreenEnter(fullscreenElement) {
    console.log('Entering fullscreen:', fullscreenElement);
    if (fullscreenElement.tagName === 'VIDEO') {
        addSubwayVideo(fullscreenElement);
    } else if (fullscreenElement.tagName === 'IFRAME') {
        try {
            const iframeDoc = fullscreenElement.contentDocument || fullscreenElement.contentWindow.document;
            const videoEl = iframeDoc.querySelector('video');
            if (videoEl) {
                addSubwayVideo(videoEl);
            }
        } catch (e) {
            console.log('Cross-origin iframe detected. Injecting global subway video.');
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
    console.log('Exiting fullscreen.');
    removeSubwayVideo();
    removeGlobalSubwayVideo();
}

// Add fullscreen change listener
document.addEventListener('fullscreenchange', () => {
    const fullscreenElement = document.fullscreenElement;
    if (fullscreenElement) {
        handleFullscreenEnter(fullscreenElement);
    } else {
        handleFullscreenExit();
    }
});

// Ensure subway videos are not duplicated on initial load
window.addEventListener('load', () => {
    console.log('Page loaded.');
    // Optional: Initialize or clean up subway videos on page load
});

function observeDOM() {
    function processNode(node) {
        if (node.nodeName === 'VIDEO' ||
            (node.nodeName === 'DIV' && node.classList.contains('mwEmbedPlayer')) ||
            (node.nodeName === 'VIDEO' && node.classList.contains('persistentNativePlayer')) ||
            (node.nodeName === 'IFRAME' && node.classList.contains('mwEmbedKalturaIframe'))) {

            let videoEl = null;

            if (node.nodeName === 'VIDEO') {
                videoEl = node;
            } else if (node.nodeName === 'DIV' || node.nodeName === 'IFRAME') {
                try {
                    // Attempt to access video within iframe
                    if (node.nodeName === 'IFRAME') {
                        const iframeDoc = node.contentDocument || node.contentWindow.document;
                        videoEl = iframeDoc.querySelector('video');
                    } else {
                        videoEl = node.querySelector('video');
                    }
                } catch (e) {
                    console.log('Cannot access iframe content due to same-origin policy');
                }
            }

            if (videoEl) {
                addSubwayVideo(videoEl);
            } else {
                const checkInterval = setInterval(() => {
                    try {
                        if (node.nodeName === 'IFRAME') {
                            const iframeDoc = node.contentDocument || node.contentWindow.document;
                            videoEl = iframeDoc.querySelector('video');
                        } else {
                            videoEl = node.querySelector('video');
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
        attributeFilter: ['src', 'class']
    };

    function setupObserver(target) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(processNode);
                } else if (mutation.type === 'attributes') {
                    processNode(mutation.target);
                }
            });
        });

        observer.observe(target, observerConfig);
    }

    document.querySelectorAll('video, .mwEmbedPlayer').forEach(processNode);

    document.querySelectorAll('iframe').forEach(iframe => {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.querySelectorAll('video, .mwEmbedPlayer').forEach(processNode);
            setupObserver(iframeDoc.body);
        } catch (e) {
            console.log('Cannot access iframe content due to same-origin policy');
        }
    });

    setupObserver(document.body);
}

// Initialize DOM observation
observeDOM();