import { useEffect, useRef } from "react";

interface VideoAvatarProps {
  streamUrl?: string;
}

export const VideoAvatar = ({ streamUrl }: VideoAvatarProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && streamUrl) {
      videoRef.current.src = streamUrl;
    }
  }, [streamUrl]);

  return (
    <div className="relative w-full aspect-video max-w-2xl mx-auto rounded-lg overflow-hidden bg-gray-100 animate-fade-in">
      {streamUrl ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">Loading avatar...</p>
        </div>
      )}
    </div>
  );
};