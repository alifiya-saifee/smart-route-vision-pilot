
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

// Mock video URL - this would normally be a real video stream or webcam feed
const MOCK_VIDEO_URL = "https://static.videezy.com/system/resources/previews/000/037/754/original/main.mp4";

interface VideoFeedProps {
  className?: string;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>(MOCK_VIDEO_URL);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    
    // Handle successful loading
    const handleCanPlay = () => {
      setIsLoaded(true);
      setError(null);
    };
    
    // Handle errors
    const handleError = () => {
      setError("Error loading video feed. Using fallback display.");
      setIsLoaded(false);
    };
    
    // Register event listeners
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);
    
    // Start playing the video
    videoElement.play().catch(err => {
      console.error("Video playback error:", err);
      setError("Video playback not allowed. Using fallback display.");
    });
    
    // Clean up event listeners
    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
    };
  }, [videoSrc]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsLoaded(false);
      setError(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className || ''}`}>
      <video
        ref={videoRef}
        src={videoSrc}
        loop
        muted
        playsInline
        className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-white">
          {error ? (
            <>
              <p className="text-lg font-medium text-red-400 mb-2">⚠️ {error}</p>
              <div className="w-60 h-40 border border-gray-600 rounded flex items-center justify-center bg-gray-700">
                <p className="text-sm text-gray-400">Video simulation</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg mb-2">Loading video feed...</p>
              <div className="animate-pulse w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
            </>
          )}
        </div>
      )}

      <div className="absolute top-4 right-4 z-10">
        <Button 
          onClick={triggerFileInput} 
          variant="secondary" 
          size="sm" 
          className="bg-black/50 hover:bg-black/70"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="video/*" 
          onChange={handleFileUpload} 
          className="hidden" 
        />
      </div>
    </div>
  );
};

export default VideoFeed;
