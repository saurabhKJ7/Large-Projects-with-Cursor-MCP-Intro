import React, { useState } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import ChatInterface from './components/ChatInterface';

function App() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const handleVideoProcessed = (id: string) => {
    setVideoId(id);
  };

  const handleTimestampClick = (time: number) => {
    setCurrentTime(time);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Chat with your Lecture
        </h1>
        
        {!videoId ? (
          <div className="max-w-2xl mx-auto">
            <VideoUploader onVideoProcessed={handleVideoProcessed} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <VideoPlayer
                videoId={videoId}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
              />
            </div>
            <div className="h-[600px]">
              <ChatInterface
                videoId={videoId}
                onTimestampClick={handleTimestampClick}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
