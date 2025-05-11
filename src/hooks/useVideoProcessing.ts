
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Mock video URL - this would normally be a real video stream or webcam feed
const MOCK_VIDEO_URL = "https://static.videezy.com/system/resources/previews/000/037/754/original/main.mp4";
// Alternative road videos if the primary one fails
const FALLBACK_VIDEOS = [
  "https://static.videezy.com/system/resources/previews/000/007/368/original/Highway_Forward_Dashboard.mp4",
  "https://static.videezy.com/system/resources/previews/000/050/684/original/5.mp4"
];

export const useVideoProcessing = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>(MOCK_VIDEO_URL);
  const { toast } = useToast();
  const videoErrorCount = useRef<number>(0);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    
    // Handle successful loading
    const handleCanPlay = () => {
      setIsLoaded(true);
      setError(null);
      console.log("Video can play now");
    };
    
    // Handle errors
    const handleError = (e: Event) => {
      console.error("Video error:", e);
      videoErrorCount.current += 1;
      
      // Try fallback videos if the main one fails
      if (videoErrorCount.current <= FALLBACK_VIDEOS.length) {
        const fallbackVideo = FALLBACK_VIDEOS[videoErrorCount.current - 1];
        console.log(`Trying fallback video #${videoErrorCount.current}:`, fallbackVideo);
        setVideoSrc(fallbackVideo);
      } else {
        setError("Error loading video feed. Using fallback display.");
        setIsLoaded(false);
      }
    };
    
    // Register event listeners
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);
    
    // Start playing the video
    videoElement.play().catch(err => {
      console.error("Video playback error:", err);
      handleError(new Event('error'));
    });
    
    // Clean up event listeners
    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
    };
  }, [videoSrc]);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    
    // Check if the file is a video
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive"
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setIsLoaded(false);
    setError(null);
    videoErrorCount.current = 0;
    toast({
      title: "Video uploaded",
      description: `Now playing: ${file.name}`,
    });
  };

  return {
    videoRef,
    isLoaded,
    error,
    videoSrc,
    handleFileUpload
  };
};
