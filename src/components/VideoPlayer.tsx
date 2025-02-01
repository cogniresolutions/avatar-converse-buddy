import { forwardRef } from "react";

interface VideoPlayerProps {
  src: string;
  onTimeUpdate?: () => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, onTimeUpdate }, ref) => {
    return (
      <video
        ref={ref}
        className="w-full aspect-video rounded-lg"
        controls
        onTimeUpdate={onTimeUpdate}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";