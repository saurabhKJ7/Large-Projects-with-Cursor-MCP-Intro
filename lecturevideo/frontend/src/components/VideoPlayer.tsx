import React, { useRef } from 'react';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  videoId: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}

interface PlayerProgress {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, currentTime, onTimeUpdate }) => {
  const playerRef = useRef<ReactPlayer | null>(null);

  React.useEffect(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(currentTime, 'seconds');
    }
  }, [currentTime]);

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <ReactPlayer
        ref={playerRef}
        url={`http://localhost:8000/uploads/${videoId}.mp4`}
        width="100%"
        height="100%"
        controls
        playing
        onProgress={(state: PlayerProgress) => onTimeUpdate(state.playedSeconds)}
      />
    </div>
  );
};

export default VideoPlayer; 