import React, { useEffect, useState } from 'react';
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

// Main App component
const App = () => {
    const [audioLevelData, setAudioLevelData] = useState({
        level: 0,
        warning: false,
        lastUpdateTime: null
    });

    useEffect(() => {
        // Add fullscreen event listeners
        const handleFullscreenChange = () => {
            const fullscreenElement = document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement;

            const overlay = document.getElementById('tab-capture-overlay');
            if (!overlay) return;

            if (fullscreenElement) {
                // When entering fullscreen, move the overlay to the fullscreen element
                fullscreenElement.appendChild(overlay);
            } else {
                // When exiting fullscreen, move the overlay back to the container
                overlayContainer.appendChild(overlay);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        // Watch for custom fullscreen implementations
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const overlay = document.getElementById('tab-capture-overlay');
                    if (!overlay) return;

                    const isFullscreen = document.documentElement.classList.contains('fullscreen') ||
                        document.documentElement.classList.contains('fullscreen-mode');

                    if (isFullscreen) {
                        document.documentElement.appendChild(overlay);
                    } else {
                        overlayContainer.appendChild(overlay);
                    }
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Monitor audio level updates
        let audioMonitorInterval;
        if (audioLevelData.lastUpdateTime) {
            audioMonitorInterval = setInterval(() => {
                const now = Date.now();
                const timeSinceLastUpdate = now - audioLevelData.lastUpdateTime;

                if (timeSinceLastUpdate > 3000) {
                    setAudioLevelData(prev => ({
                        ...prev,
                        warning: true,
                        level: Math.min(30, timeSinceLastUpdate / 100)
                    }));
                }
            }, 1000);
        }

        // Add custom styles for text shadow
        const style = document.createElement('style');
        style.textContent = `
            .text-shadow {
                text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            @keyframes pulse {
                0% { opacity: 0.8; }
                50% { opacity: 1; }
                100% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);

        return () => {
            // Clean up event listeners
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

            observer.disconnect();

            if (audioMonitorInterval) {
                clearInterval(audioMonitorInterval);
            }

            if (style && style.parentNode) {
                style.parentNode.removeChild(style);
            }
        };
    }, [audioLevelData.lastUpdateTime]);

    return <Overlay />;
};

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
        }

        window.lastAudioDataTime = Date.now();

        // This will be handled by the React component
        if (window.updateAudioLevel) {
            window.updateAudioLevel(message.level);
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

        // Create React root and render app component
        overlayRoot = createRoot(container);

        // Function to update audio level from outside React
        window.updateAudioLevel = (level) => {
            const event = new CustomEvent('audioLevelUpdate', { detail: { level } });
            window.dispatchEvent(event);
        };

        overlayRoot.render(<App />);
    }
}

function hideOverlay() {
    if (overlayRoot) {
        overlayRoot.unmount();
        overlayRoot = null;
    }
} 