import { useState, useRef, useEffect } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ChatInterface } from "@/components/ChatInterface";
import { VideoUploader } from "@/components/VideoUploader";
import { useTrainingSession } from "@/hooks/useTrainingSession";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function Training() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();
  const {
    session,
    isLoading,
    uploadVideo,
    sendQuestion,
    messages,
  } = useTrainingSession();

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoUpload = async (file: File) => {
    try {
      await uploadVideo(file);
      toast({
        title: "Success",
        description: "Video uploaded successfully. Processing transcript...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Interactive Training Session</h1>
      
      {!session ? (
        <div className="max-w-xl mx-auto">
          <VideoUploader onUpload={handleVideoUpload} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <VideoPlayer
              ref={videoRef}
              src={session.videoUrl}
              onTimeUpdate={handleTimeUpdate}
            />
            <div className="text-sm text-gray-500">
              Current time: {new Date(currentTime * 1000).toISOString().substr(11, 8)}
            </div>
          </div>
          
          <div className="h-[600px] border rounded-lg overflow-hidden">
            <ChatInterface
              messages={messages}
              onSendMessage={sendQuestion}
              isLoading={isLoading}
              currentTime={currentTime}
            />
          </div>
        </div>
      )}
    </div>
  );
}