console.log('Content script loaded!');

function addSubwayVideo(videoElement) {
    if (videoElement.hasAttribute('data-subway-video-added')) {
        return;
    }

    console.log('Found a video element:', videoElement);

    let videoContainer = videoElement.parentElement;

    const originalHeight = videoElement.offsetHeight;
    const containerHeight = originalHeight;
    const containerWidth = Math.floor(containerHeight * (9 / 16));

    const subwayContainer = document.createElement('div');
    subwayContainer.style.width = `${containerWidth}px`;
    subwayContainer.style.height = `${containerHeight}px`;
    subwayContainer.style.overflow = 'hidden';
    subwayContainer.style.flexShrink = '0';

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

    function updateLayout() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

        if (isFullscreen) {
            flexContainer.style.display = 'flex';
            flexContainer.style.flexDirection = 'row';
            flexContainer.style.gap = '5px';
            flexContainer.style.alignItems = 'center';
            flexContainer.style.width = '100%';
            flexContainer.style.height = '100vh';
            flexContainer.style.justifyContent = 'center';

            videoElement.style.flex = '1';
            videoElement.style.height = '100%';
            videoElement.style.maxHeight = '100vh';
            videoElement.style.maxWidth = '85%';

            const viewportHeight = window.innerHeight;
            const subwayHeight = viewportHeight * 0.6;
            const subwayWidth = Math.floor(subwayHeight * (9 / 16));

            subwayContainer.style.width = `${subwayWidth}px`;
            subwayContainer.style.height = `${subwayHeight}px`;
            subwayContainer.style.position = 'static';
            subwayContainer.style.flexShrink = '0';
            subwayContainer.style.marginRight = '0px';
        } else {
            flexContainer.style.display = 'flex';
            flexContainer.style.flexDirection = 'row';
            flexContainer.style.gap = '5px';
            flexContainer.style.alignItems = 'flex-start';
            flexContainer.style.width = `${videoElement.offsetWidth + containerWidth + 5}px`;
            flexContainer.style.height = 'auto';
            flexContainer.style.justifyContent = 'flex-start';

            videoElement.style.flex = '0 0 auto';
            videoElement.style.width = `${videoElement.offsetWidth}px`;
            videoElement.style.height = 'auto';
            videoElement.style.maxWidth = 'none';
            videoElement.style.maxHeight = 'none';

            subwayContainer.style.width = `${containerWidth}px`;
            subwayContainer.style.height = `${containerHeight}px`;
            subwayContainer.style.position = 'static';
            subwayContainer.style.marginRight = '0';
            subwayContainer.style.flexShrink = '0';
        }
    }

    document.addEventListener('fullscreenchange', updateLayout);
    document.addEventListener('webkitfullscreenchange', updateLayout);

    videoElement.parentNode.insertBefore(flexContainer, videoElement);

    flexContainer.appendChild(videoElement);

    subwayContainer.appendChild(subwayVideo);
    flexContainer.appendChild(subwayContainer);

    updateLayout();

    videoElement.setAttribute('data-subway-video-added', 'true');

    console.log('Added subway video next to video');

    videoContainer.style.position = 'relative';
    videoContainer.style.width = 'fit-content';
}

function observeDOM() {
    document.querySelectorAll('video').forEach(video => {
        addSubwayVideo(video);
    });

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'VIDEO') {
                    addSubwayVideo(node);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

observeDOM();