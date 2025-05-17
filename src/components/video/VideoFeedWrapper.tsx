
import React from 'react';
import { VideoStateProvider } from '@/components/video/VideoStateProvider';
import VideoFeed from '@/components/VideoFeed';

interface VideoFeedWrapperProps {
  className?: string;
}

const VideoFeedWrapper: React.FC<VideoFeedWrapperProps> = ({ className }) => {
  return (
    <VideoStateProvider>
      <VideoFeed className={className} />
    </VideoStateProvider>
  );
};

export default VideoFeedWrapper;
