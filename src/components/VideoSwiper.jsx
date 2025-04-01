import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const VideoSwiper = ({ videos }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const swiperRef = useRef(null);

    // YouTube video ID for the provided embed
    const youtubeVideos = [
        { id: "FXckmIoiIBs" },

        { id: "VS3D8bgYhf4", zoom: true },
        { id: "7XNJvtLRu7g", zoom: true },
        { id: "2LaCKzfTEoA", zoom: true },
        { id: "u7kdVe8q5zs", zoom: true },
        { id: "y0Xso_JdbZE", zoom: true },
        { id: "8OnJ7xE7iaM", zoom: true },
        // You can add more YouTube video IDs here
    ];

    const goToNextVideo = () => {
        setCurrentIndex(prevIndex =>
            prevIndex >= youtubeVideos.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToPreviousVideo = () => {
        setCurrentIndex(prevIndex =>
            prevIndex <= 0 ? youtubeVideos.length - 1 : prevIndex - 1
        );
    };

    return (
        <div
            ref={swiperRef}
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{ touchAction: 'pan-y' }}
        >
            {youtubeVideos.map((video, index) => (
                <div
                    key={index}
                    className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out"
                    style={{
                        transform: `translateY(${(index - currentIndex) * 100}%)`,
                        opacity: index === currentIndex ? 1 : 0.5,
                        zIndex: youtubeVideos.length - Math.abs(currentIndex - index),
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                    }}
                >
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${video.id}?si=Ikwo-klZdkp2Hie5&controls=0&autoplay=${index === currentIndex ? 1 : 0}&mute=1&loop=1&playlist=${video.id}&showinfo=0&rel=0&modestbranding=1&vq=hd1080&hd=1&quality=hd1080`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            className={`absolute inset-0 pointer-events-none ${video.zoom ? 'w-[180%] h-[180%] left-[-40%] top-[-40%]' : 'w-full h-full'}`}
                            style={{
                                objectFit: "cover",
                                transform: video.zoom ? "scale(2.5)" : "none"
                            }}
                        ></iframe>
                    </div>
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