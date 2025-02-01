import { useEffect, useRef, useState } from "react";

interface VideoAvatarProps {
  streamUrl?: string;
}

export const VideoAvatar = ({ streamUrl }: VideoAvatarProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current && streamUrl) {
      setIsLoading(true);
      setError(null);
      
      videoRef.current.src = streamUrl;
      videoRef.current.onerror = () => {
        setError("Failed to load video stream");
        setIsLoading(false);
      };
      videoRef.current.onloadeddata = () => {
        setIsLoading(false);
      };
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
          <div className="text-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500">Loading avatar...</p>
              </div>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <p className="text-gray-500">Waiting for stream...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};