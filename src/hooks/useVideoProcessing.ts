
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
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  const uniqueIdRef = useRef(`video-${Date.now()}`);
  
  // Track component mount state with improved cleanup tracking
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      // Set unmounted flag first to prevent any new operations
      isMountedRef.current = false;
      
      // Execute all registered cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (err) {
          console.error("Cleanup error:", err);
        }
      });
      
      // Clear the cleanup functions array
      cleanupFunctionsRef.current = [];
    };
  }, []);

  // Helper to register cleanup functions
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.push(cleanupFn);
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
    
    // Register event listeners with proper error handling
    try {
      videoElement.addEventListener('canplay', canPlayHandler);
      videoElement.addEventListener('error', errorHandler);
    } catch (err) {
      console.error("Error adding event listeners:", err);
    }
    
    // Start playing the video if not using camera
    if (!isCameraActive && videoElement) {
      try {
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            if (!isMountedRef.current) return;
            console.error("Video playback error:", err);
            if (errorHandler) errorHandler(new Event('error'));
          });
        }
      } catch (err) {
        console.error("Error starting video playback:", err);
      }
    }
    
    // Register cleanup using our helper
    registerCleanup(() => {
      try {
        if (videoElement) {
          if (canPlayHandler) videoElement.removeEventListener('canplay', canPlayHandler);
          if (errorHandler) videoElement.removeEventListener('error', errorHandler);
          
          // Pause video on cleanup to prevent memory leaks
          try {
            videoElement.pause();
            videoElement.src = '';
            videoElement.load();
          } catch (err) {
            console.error("Error cleaning up video element:", err);
          }
        }
      } catch (err) {
        console.error("Error removing event listeners:", err);
      }
    });
    
    return () => {
      try {
        if (videoElement) {
          if (canPlayHandler) videoElement.removeEventListener('canplay', canPlayHandler);
          if (errorHandler) videoElement.removeEventListener('error', errorHandler);
        }
      } catch (err) {
        console.error("Error removing event listeners in cleanup:", err);
      }
    };
  }, [videoSrc, isCameraActive, registerCleanup]);

  // Function to toggle camera stream with improved safety and cleanup
  const toggleCameraStream = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      if (isCameraActive && cameraStreamRef.current) {
        // Safely stop all tracks in the stream
        try {
          cameraStreamRef.current.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (err) {
              console.error("Error stopping camera track:", err);
            }
          });
        } catch (err) {
          console.error("Error accessing camera tracks:", err);
        }
        
        cameraStreamRef.current = null;
        
        if (isMountedRef.current) {
          setIsCameraActive(false);
          
          // Reset video source with improved error handling
          if (videoRef.current) {
            try {
              videoRef.current.srcObject = null;
              videoRef.current.src = videoSrc;
              
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise.catch(err => {
                  console.error("Error playing video after camera stop:", err);
                });
              }
            } catch (err) {
              console.error("Error resetting video source:", err);
            }
          }
          
          toast({
            title: "Camera stopped",
            description: "Switched back to video simulation"
          });
        }
        return;
      }

      // Request camera access with better error handling
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment", // Prefer rear camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
        toast({
          title: "Camera error",
          description: "Failed to access device camera. Check permissions.",
          variant: "destructive"
        });
        return;
      }
      
      if (!isMountedRef.current) {
        // Clean up stream if component unmounted during async operation
        try {
          stream.getTracks().forEach(track => track.stop());
        } catch (err) {
          console.error("Error stopping tracks after unmount:", err);
        }
        return;
      }
      
      // Save reference to the stream
      cameraStreamRef.current = stream;
      
      // Set the stream as the video source
      if (videoRef.current) {
        try {
          videoRef.current.srcObject = stream;
          
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              if (!isMountedRef.current) return;
              console.error("Error playing camera stream:", err);
              setError("Could not play camera stream.");
            });
          }
        } catch (err) {
          console.error("Error setting video source:", err);
          setError("Could not set camera as video source.");
          return;
        }
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
      
      console.error("Unexpected error accessing camera:", err);
      setError("Could not access camera. Unexpected error occurred.");
      setIsCameraActive(false);
      
      toast({
        title: "Camera error",
        description: "Failed to access device camera. Unknown error occurred.",
        variant: "destructive"
      });
    }
  }, [videoSrc, isCameraActive, toast]);

  const handleFileUpload = useCallback((file: File) => {
    if (!isMountedRef.current) return;
    
    // Stop camera if active with improved error handling
    if (isCameraActive && cameraStreamRef.current) {
      try {
        cameraStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (err) {
            console.error("Error stopping camera track:", err);
          }
        });
      } catch (err) {
        console.error("Error accessing camera tracks:", err);
      }
      
      cameraStreamRef.current = null;
      setIsCameraActive(false);
      
      if (videoRef.current) {
        try {
          videoRef.current.srcObject = null;
        } catch (err) {
          console.error("Error clearing srcObject:", err);
        }
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

    // Create object URL with proper cleanup registration
    try {
      const url = URL.createObjectURL(file);
      
      // Register cleanup for this URL
      registerCleanup(() => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error("Error revoking object URL:", err);
        }
      });
      
      setVideoSrc(url);
      setIsLoaded(false);
      setError(null);
      videoErrorCount.current = 0;
      
      toast({
        title: "Video uploaded",
        description: `Now playing: ${file.name}`,
      });
    } catch (err) {
      console.error("Error creating object URL:", err);
      toast({
        title: "Upload error",
        description: "Failed to process video file.",
        variant: "destructive"
      });
    }
  }, [isCameraActive, toast, registerCleanup]);

  // Clean up on unmount with improved error handling
  useEffect(() => {
    // Register cleanup for any blob URLs
    if (videoSrc.startsWith('blob:')) {
      registerCleanup(() => {
        try {
          URL.revokeObjectURL(videoSrc);
        } catch (err) {
          console.error("Error revoking object URL on unmount:", err);
        }
      });
    }
    
    return () => {
      if (cameraStreamRef.current) {
        try {
          cameraStreamRef.current.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (err) {
              console.error("Error stopping camera track on unmount:", err);
            }
          });
        } catch (err) {
          console.error("Error accessing camera tracks on unmount:", err);
        }
        cameraStreamRef.current = null;
      }
    };
  }, [videoSrc, registerCleanup]);

  return {
    videoRef,
    isLoaded,
    error,
    videoSrc,
    handleFileUpload,
    toggleCameraStream,
    isCameraActive,
    uniqueId: uniqueIdRef.current // Provide stable unique ID
  };
};
