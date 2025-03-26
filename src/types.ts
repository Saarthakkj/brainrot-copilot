// Types for video details
export interface VideoDetails {
  currentTime: number;
  videoId: string | null;
  playing: boolean;
  originalVideo: HTMLVideoElement | null;
}

// Common style interfaces
export interface StyleOptions {
  [key: string]: string;
}

// Video player interface
export interface VideoPlayer {
  element: HTMLVideoElement | HTMLElement;
  type: "youtube" | "jwplayer" | "standard" | "unknown" | "mejs";
  getVideoUrl?: () => string | null;
  getCurrentTime?: () => number;
  isPlaying?: () => boolean;
  play?: () => Promise<void>;
  pause?: () => void;
  seekTo?: (time: number) => void;
}

// YouTube player interface
export interface YouTubePlayer extends VideoPlayer {
  type: "youtube";
  getVideoId: () => string | null;
}
