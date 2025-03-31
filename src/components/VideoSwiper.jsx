import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const VideoSwiper = ({ videos }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const swiperRef = useRef(null);
    const videoRefs = useRef([]);

    // Set up video refs
    useEffect(() => {
        videoRefs.current = videoRefs.current.slice(0, videos.length);
    }, [videos]);

    // Handle video playback when index changes
    useEffect(() => {
        // Pause all videos first
        videoRefs.current.forEach((videoRef, index) => {
            if (videoRef && index !== currentIndex) {
                videoRef.pause();
            }
        });

        // Play the current video
        const currentVideo = videoRefs.current[currentIndex];
        if (currentVideo) {
            currentVideo.play().catch(err => console.error("Video play error:", err));
        }
    }, [currentIndex]);

    const goToNextVideo = () => {
        setCurrentIndex(prevIndex =>
            prevIndex >= videos.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToPreviousVideo = () => {
        setCurrentIndex(prevIndex =>
            prevIndex <= 0 ? videos.length - 1 : prevIndex - 1
        );
    };

    return (
        <div
            ref={swiperRef}
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{ touchAction: 'pan-y' }}
        >
            {videos.map((video, index) => (
                <div
                    key={index}
                    className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out"
                    style={{
                        transform: `translateY(${(index - currentIndex) * 100}%)`,
                        opacity: index === currentIndex ? 1 : 0.5,
                        zIndex: videos.length - Math.abs(currentIndex - index),
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                    }}
                >
                    <video
                        ref={el => videoRefs.current[index] = el}
                        src={chrome.runtime.getURL(video.src)}
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                </div>
            ))}

            {/* Navigation buttons */}
            <div className="absolute bottom-20 right-5 flex flex-col gap-2 z-20">
                <button
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/20 text-white hover:bg-black/60 transition-all active:scale-95"
                    onClick={goToPreviousVideo}
                    aria-label="Previous video"
                >
                    <ChevronUp size={24} className="stroke-white" />
                </button>
                <button
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/20 text-white hover:bg-black/60 transition-all active:scale-95"
                    onClick={goToNextVideo}
                    aria-label="Next video"
                >
                    <ChevronDown size={24} className="stroke-white" />
                </button>
            </div>
        </div>
    );
};

export default VideoSwiper; 