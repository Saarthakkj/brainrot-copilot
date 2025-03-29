import React from 'react';
import { createRoot } from 'react-dom/client';
import Overlay from './src/components/Overlay';

let overlayRoot = null;

// Create and inject the overlay container
const overlayContainer = document.createElement('div');
overlayContainer.id = 'tab-capture-overlay-container';
document.body.appendChild(overlayContainer);

// Calculate dimensions based on iPhone proportions (19.5:9)
const height = window.innerHeight * 0.7;
const width = height * (9 / 19.5); // iPhone aspect ratio

// App icons data
const apps = [
    { name: 'Fortnite', icon: 'icons/fortnite.png' },
    { name: 'Rocket League', icon: 'icons/rocket-league.png' },
    { name: 'Minecraft', icon: 'icons/minecraft.png' },
    { name: 'Slime', icon: 'icons/slime.png' },
    { name: 'Subway Surfers', icon: 'icons/subway-surfers.png' }
];

// Handle fullscreen changes
function handleFullscreenChange() {
    const fullscreenElement = document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

    if (fullscreenElement) {
        // When entering fullscreen, move the overlay to the fullscreen element
        const overlay = document.getElementById('tab-capture-overlay');
        if (overlay) {
            fullscreenElement.appendChild(overlay);
        }
    } else {
        // When exiting fullscreen, move the overlay back to the container
        const overlay = document.getElementById('tab-capture-overlay');
        if (overlay) {
            overlayContainer.appendChild(overlay);
        }
    }
}

// Watch for custom fullscreen implementations
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (
            mutation.type === "attributes" &&
            mutation.attributeName === "style"
        ) {
            const target = mutation.target;
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
                container.id = 'tab-capture-overlay-container';
                container.style.display = "block";
                container.style.opacity = "1";
                target.appendChild(container);

                // Move overlay to the new container
                const overlay = document.getElementById('tab-capture-overlay');
                if (overlay) {
                    container.appendChild(overlay);
                }
            }
        }
    }
});

// Add fullscreen event listeners
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

// Start observing for custom fullscreen
observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
});

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'toggle-overlay') {
        if (message.show) {
            showOverlay();
        } else {
            hideOverlay();
        }
        sendResponse({ success: true });
    } else if (message.type === 'ping') {
        sendResponse({ status: 'ok' });
    } else if (message.type === 'audio-data') {
        // Process audio data message from service worker
        if (window.lastAudioDataTime) {
            // Reset the no-audio warning if we're receiving data
            window.lastAudioDataTime = Date.now();
        }
        sendResponse({ success: true });
        return true;
    } else if (message.type === 'audio-level') {
        // Record the time we received an audio level update
        if (!window.lastAudioDataTime) {
            window.lastAudioDataTime = Date.now();

            // Start monitoring for audio level updates
            if (!window.audioLevelMonitor) {
                window.audioLevelMonitor = setInterval(() => {
                    const now = Date.now();
                    const timeSinceLastUpdate = now - window.lastAudioDataTime;

                    // If no updates for 3 seconds, show warning
                    if (timeSinceLastUpdate > 3000) {
                        // console.warn('[UI] No audio level updates received in the last 3 seconds'); // VERBOSE - handled in component

                        // Update UI to show warning
                        const audioMeter = document.getElementById('audio-meter');
                        if (audioMeter) {
                            audioMeter.style.background = `linear-gradient(90deg, 
                                #ff5252 ${Math.min(30, timeSinceLastUpdate / 100)}%, 
                                rgba(255,82,82,0.1) ${Math.min(30, timeSinceLastUpdate / 100)}%
                            )`;

                            // Add pulsing effect
                            audioMeter.style.animation = 'pulse 1s infinite';
                        }
                    }
                }, 1000);
            }
        }

        window.lastAudioDataTime = Date.now();

        // Update the audio meter visualization
        const audioMeter = document.getElementById('audio-meter');
        if (audioMeter) {
            // Remove warning indicators if we're getting updates again
            audioMeter.style.animation = '';

            // Update the level indicator
            audioMeter.style.background = `linear-gradient(90deg, 
                #0d84fc ${message.level}%, 
                rgba(13,132,252,0.1) ${message.level}%
            )`;
        }
    }
    return true; // Keep the message channel open for async response
});

function showOverlay() {
    if (!overlayRoot) {
        // Create container if it doesn't exist
        let container = document.getElementById('tab-capture-overlay-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'tab-capture-overlay-container';
            document.body.appendChild(container);
        }

        // Create React root and render overlay
        overlayRoot = createRoot(container);
        overlayRoot.render(<Overlay />);
    }
}

function hideOverlay() {
    if (overlayRoot) {
        overlayRoot.unmount();
        overlayRoot = null;
    }
    const container = document.getElementById('tab-capture-overlay-container');
    if (container) {
        container.remove();
    }
}

// Function to create an app icon
function createAppIcon(app) {
    const appIcon = document.createElement('div');
    appIcon.className = 'flex flex-col items-center w-14 transition-all duration-200 ease-in-out hover:scale-110 hover:opacity-80';

    const iconImage = document.createElement('div');
    iconImage.className = 'w-14 h-14 rounded-[18px] overflow-hidden shadow-lg mb-1';

    const img = document.createElement('img');
    img.src = chrome.runtime.getURL(app.icon);
    img.alt = app.name;
    img.className = 'w-full h-full object-cover';
    iconImage.appendChild(img);

    const iconName = document.createElement('div');
    iconName.className = 'text-[10px] text-white text-center truncate w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]';
    iconName.textContent = app.name;

    appIcon.appendChild(iconImage);
    appIcon.appendChild(iconName);

    return appIcon;
}

// Function to initialize the overlay
function initializeOverlay() {
    // Create the overlay element
    const overlay = document.createElement('div');
    overlay.id = 'tab-capture-overlay';
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    overlay.className = 'fixed left-5 top-5 bg-black rounded-[44px] shadow-lg cursor-grab select-none flex flex-col pointer-events-auto z-max overflow-hidden border-[10px] border-black';

    // Add iPhone notch
    const notch = document.createElement('div');
    notch.className = 'absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[30px] bg-black rounded-b-[14px] z-max-plus';
    overlay.appendChild(notch);

    // Add volume buttons
    const volumeUp = document.createElement('div');
    volumeUp.className = 'absolute -left-[12px] top-[100px] w-1 h-[50px] bg-[#222] rounded-[2px] z-max-plus';
    overlay.appendChild(volumeUp);

    const volumeDown = document.createElement('div');
    volumeDown.className = 'absolute -left-[12px] top-[160px] w-1 h-[50px] bg-[#222] rounded-[2px] z-max-plus';
    overlay.appendChild(volumeDown);

    // Add power button
    const powerButton = document.createElement('div');
    powerButton.className = 'absolute -right-[12px] top-[120px] w-1 h-[60px] bg-[#222] rounded-[2px] z-max-plus';
    overlay.appendChild(powerButton);

    // Add main content
    const content = document.createElement('div');
    content.className = 'w-full h-full flex flex-col relative bg-gradient-to-br from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d]';

    // Add status bar
    const statusBar = document.createElement('div');
    statusBar.className = 'flex justify-between px-4 py-1 text-white text-xs font-bold h-6 bg-black/20 backdrop-blur';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    statusBar.innerHTML = `
        <div>${timeStr}</div>
        <div class="flex gap-1">
            <span>📶</span>
            <span>🔋</span>
        </div>
    `;
    content.appendChild(statusBar);

    // Add app grid
    const appGrid = document.createElement('div');
    appGrid.className = 'flex-1 grid grid-cols-3 gap-3 p-3 pt-12';

    // Add app icons to the grid
    apps.forEach(app => {
        appGrid.appendChild(createAppIcon(app));
    });

    content.appendChild(appGrid);

    // Add home indicator
    const homeIndicator = document.createElement('div');
    homeIndicator.className = 'absolute bottom-2 left-1/2 -translate-x-1/2 w-[30%] h-1 bg-white/50 rounded';
    content.appendChild(homeIndicator);

    overlay.appendChild(content);
    overlayContainer.appendChild(overlay);
}

// Add custom styles for text shadow
const style = document.createElement('style');
style.textContent = `
    .text-shadow {
        text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
`;
document.head.appendChild(style); 