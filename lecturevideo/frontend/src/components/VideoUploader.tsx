import React, { useCallback, useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

interface VideoUploaderProps {
  onVideoProcessed: (videoId: string) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoProcessed }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'video/mp4') {
      await handleUpload(file);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUpload(file);
    }
  }, []);

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress('Uploading video...');
      
      const uploadResponse = await api.uploadVideo(file);
      const videoId = uploadResponse.filename.split('.')[0];
      
      setUploadProgress('Processing video...');
      await api.processVideo(videoId);
      
      onVideoProcessed(videoId);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-700 mb-2">
        {isUploading ? uploadProgress : 'Upload your lecture video'}
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Drag and drop your MP4 file here, or click to select
      </p>
      <input
        type="file"
        accept="video/mp4"
        onChange={handleFileSelect}
        className="hidden"
        id="video-upload"
        disabled={isUploading}
      />
      <label
        htmlFor="video-upload"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer disabled:opacity-50"
      >
        Select Video
      </label>
    </div>
  );
};

export default VideoUploader; 