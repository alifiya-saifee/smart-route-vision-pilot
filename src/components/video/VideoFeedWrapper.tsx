
import React, { useEffect } from 'react';
import { VideoStateProvider } from '@/components/video/VideoStateProvider';
import VideoFeed from '@/components/VideoFeed';
import { clearToasts } from '@/components/ui/use-toast';

interface VideoFeedWrapperProps {
  className?: string;
}

const VideoFeedWrapper: React.FC<VideoFeedWrapperProps> = ({ className }) => {
  // Clear any stale toasts on mount and unmount
  useEffect(() => {
    // Wait for component to fully mount before clearing toasts
    const timerId = setTimeout(() => {
      clearToasts();
    }, 100);
    
    return () => {
      clearTimeout(timerId);
      // Clear toasts on unmount to prevent state conflicts
      clearToasts();
    };
  }, []);

  return (
    <VideoStateProvider>
      <VideoFeed className={className} />
    </VideoStateProvider>
  );
};

export default VideoFeedWrapper;
