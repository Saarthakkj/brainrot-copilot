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

// Function to extract YouTube video ID from URL
function getYouTubeVideoId() {
    // Check if we're on a YouTube page
    const isYouTubePage = window.location.hostname.includes('youtube.com');
    if (!isYouTubePage) return null;
    
    // Extract video ID from URL
    const url = new URL(window.location.href);
    
    // YouTube watch page
    if (url.pathname === '/watch') {
        return url.searchParams.get('v');
    }
    
    // YouTube shortened URLs
    if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/')[2];
    }
    
    // YouTube embed URLs
    if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/')[2];
    }
    
    return null;
}

// Main App component
const App = () => {
    const [isYouTubePage, setIsYouTubePage] = useState(false);
    const [videoId, setVideoId] = useState(null);
    
    useEffect(() => {
        // Check if we're on YouTube and get video ID
        const youtubeVideoId = getYouTubeVideoId();
        setIsYouTubePage(!!youtubeVideoId);
        setVideoId(youtubeVideoId);
        
        // Watch for URL changes (for single-page YouTube app)
        const handleUrlChange = () => {
            const newVideoId = getYouTubeVideoId();
            setIsYouTubePage(!!newVideoId);
            setVideoId(newVideoId);
        };
        
        window.addEventListener('popstate', handleUrlChange);
        
        // Additional listener for YouTube's navigation
        const originalPushState = window.history.pushState;
        window.history.pushState = function() {
            originalPushState.apply(this, arguments);
            handleUrlChange();
        };
        
        return () => {
            window.removeEventListener('popstate', handleUrlChange);
            window.history.pushState = originalPushState;
        };
    }, []);

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

            if (style && style.parentNode) {
                style.parentNode.removeChild(style);
            }
        };
    }, []);

    return <Overlay isYouTubePage={isYouTubePage} videoId={videoId} />;
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
        overlayRoot.render(<App />);
    }
}

function hideOverlay() {
    if (overlayRoot) {
        overlayRoot.unmount();
        overlayRoot = null;
    }
}