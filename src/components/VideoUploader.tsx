import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoUploaderProps {
  onUpload: (file: File) => Promise<void>;
}

export const VideoUploader = ({ onUpload }: VideoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      await handleFileUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      await onUpload(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? "border-primary bg-primary/5" : "border-gray-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-semibold mb-2">Upload Training Video</h3>
      <p className="text-sm text-gray-500 mb-4">
        Drag and drop your video file here, or click to select
      </p>
      <input
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
        id="video-upload"
      />
      <Button
        disabled={isUploading}
        onClick={() => document.getElementById("video-upload")?.click()}
      >
        {isUploading ? "Uploading..." : "Select Video"}
      </Button>
    </div>
  );
};