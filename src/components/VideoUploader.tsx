import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface VideoUploaderProps {
  onUpload: (file: File) => Promise<void>;
}

export const VideoUploader = ({ onUpload }: VideoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const SUPPORTED_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime'];

  const validateFile = (file: File) => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      throw new Error('Unsupported file format. Please upload MP4, WebM, or MOV files.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File is too large. Maximum size is 100MB.');
    }
  };

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
    if (file) {
      try {
        validateFile(file);
        await handleFileUpload(file);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        validateFile(file);
        await handleFileUpload(file);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      await onUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
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
      <p className="text-sm text-gray-500 mb-2">
        Drag and drop your video file here, or click to select
      </p>
      <p className="text-xs text-gray-400 mb-4">
        Supported formats: MP4, WebM, MOV (Max size: 100MB)
      </p>
      <input
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFileSelect}
        id="video-upload"
      />
      {isUploading ? (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-gray-500">
            Uploading... {uploadProgress}%
          </p>
        </div>
      ) : (
        <Button onClick={() => document.getElementById("video-upload")?.click()}>
          Select Video
        </Button>
      )}
    </div>
  );
};