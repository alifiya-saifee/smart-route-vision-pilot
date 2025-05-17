
import { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const videoErrorCount = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  
  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !isMountedRef.current) return;
    
    const videoElement = videoRef.current;
    let canPlayHandler: ((e: Event) => void) | null = null;
    let errorHandler: ((e: Event) => void) | null = null;
    
    // Handle successful loading
    canPlayHandler = (e: Event) => {
      if (!isMountedRef.current) return;
      setIsLoaded(true);
      setError(null);
      console.log("Video can play now");
    };
    
    // Handle errors
    errorHandler = (e: Event) => {
      if (!isMountedRef.current) return;
      
      console.error("Video error:", e);
      
      // Skip fallback logic if using camera
      if (isCameraActive) {
        setError("Camera error. Please check permissions or try another browser.");
        setIsLoaded(false);
        return;
      }
      
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
    videoElement.addEventListener('canplay', canPlayHandler);
    videoElement.addEventListener('error', errorHandler);
    
    // Start playing the video if not using camera
    if (!isCameraActive) {
      videoElement.play().catch(err => {
        if (!isMountedRef.current) return;
        console.error("Video playback error:", err);
        if (errorHandler) errorHandler(new Event('error'));
      });
    }
    
    // Clean up event listeners
    return () => {
      if (videoElement) {
        if (canPlayHandler) videoElement.removeEventListener('canplay', canPlayHandler);
        if (errorHandler) videoElement.removeEventListener('error', errorHandler);
      }
      
      // Set handlers to null to avoid potential memory leaks
      canPlayHandler = null;
      errorHandler = null;
    };
  }, [videoSrc, isCameraActive]);

  // Function to toggle camera stream with safety checks
  const toggleCameraStream = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      if (isCameraActive && cameraStreamRef.current) {
        // Stop all tracks in the stream
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
        
        if (isMountedRef.current) {
          setIsCameraActive(false);
          
          // Reset video source
          if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = videoSrc;
            videoRef.current.play().catch(err => console.error("Error playing video after camera stop:", err));
          }
          
          toast({
            title: "Camera stopped",
            description: "Switched back to video simulation"
          });
        }
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment", // Prefer rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (!isMountedRef.current) {
        // Clean up stream if component unmounted during async operation
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      // Save reference to the stream
      cameraStreamRef.current = stream;
      
      // Set the stream as the video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsCameraActive(true);
      setIsLoaded(true);
      setError(null);
      
      toast({
        title: "Camera active",
        description: "Using device camera for real-time detection"
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      setIsCameraActive(false);
      
      toast({
        title: "Camera error",
        description: "Failed to access device camera. Check permissions.",
        variant: "destructive"
      });
    }
  }, [videoSrc, isCameraActive, toast]);

  const handleFileUpload = useCallback((file: File) => {
    if (!isMountedRef.current) return;
    
    // Stop camera if active
    if (isCameraActive && cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
      setIsCameraActive(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    
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
  }, [isCameraActive, toast]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
      
      // Release any object URLs to prevent memory leaks
      if (videoSrc.startsWith('blob:') && isMountedRef.current) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  return {
    videoRef,
    isLoaded,
    error,
    videoSrc,
    handleFileUpload,
    toggleCameraStream,
    isCameraActive
  };
};
