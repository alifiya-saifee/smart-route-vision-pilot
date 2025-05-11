
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigation } from '@/context/NavigationContext';
import DetectionService from '@/services/DetectionService';

// Mock video URL - this would normally be a real video stream or webcam feed
const MOCK_VIDEO_URL = "https://static.videezy.com/system/resources/previews/000/037/754/original/main.mp4";
// Alternative road videos if the primary one fails
const FALLBACK_VIDEOS = [
  "https://static.videezy.com/system/resources/previews/000/007/368/original/Highway_Forward_Dashboard.mp4",
  "https://static.videezy.com/system/resources/previews/000/050/684/original/5.mp4"
];

interface VideoFeedProps {
  className?: string;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>(MOCK_VIDEO_URL);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [objectDetectionEnabled, setObjectDetectionEnabled] = useState(false);
  const [mapApiKey, setMapApiKey] = useState<string>(() => {
    return localStorage.getItem('mapApiKey') || '';
  });
  const [showMapApiInput, setShowMapApiInput] = useState<boolean>(!localStorage.getItem('mapApiKey'));
  const { toast } = useToast();
  const { updateDetectedObjects, updateLaneOffset, updateCO2Savings } = useNavigation();
  const [detectFrameCount, setDetectFrameCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const processingTimerRef = useRef<number | null>(null);
  const lastDetectionTime = useRef<number>(Date.now());
  const co2UpdateInterval = useRef<number | null>(null);
  const videoErrorCount = useRef<number>(0);
  const detectionResultsRef = useRef<any>({ objects: [], lanes: { offset: 0, direction: 'Center' } });

  useEffect(() => {
    // Initialize the detection service when component mounts
    const initializeDetection = async () => {
      try {
        const status = await DetectionService.initialize();
        console.log("Detection services initialized:", status);
      } catch (err) {
        console.error("Failed to initialize detection:", err);
        toast({
          variant: "destructive",
          title: "Detection Error",
          description: "Failed to initialize object detection"
        });
      }
    };
    
    initializeDetection();
    
    // Setup CO2 updating at regular intervals
    co2UpdateInterval.current = window.setInterval(() => {
      if (objectDetectionEnabled && isLoaded) {
        updateCO2Savings();
      }
    }, 2000); // Update CO2 every 2 seconds when detection is active

    return () => {
      // Clean up
      if (co2UpdateInterval.current) {
        clearInterval(co2UpdateInterval.current);
      }
    };
  }, [toast, objectDetectionEnabled, isLoaded, updateCO2Savings]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    
    // Handle successful loading
    const handleCanPlay = () => {
      setIsLoaded(true);
      setError(null);
      console.log("Video can play now");
      
      // Initialize canvas size to match video dimensions
      if (canvasRef.current && videoElement) {
        canvasRef.current.width = videoElement.videoWidth || videoElement.clientWidth;
        canvasRef.current.height = videoElement.videoHeight || videoElement.clientHeight;
      }
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

  // Handle object detection processing
  useEffect(() => {
    if (!objectDetectionEnabled || !isLoaded || !videoRef.current || !canvasRef.current) {
      // If detection is disabled, clear any existing processing
      if (processingTimerRef.current) {
        cancelAnimationFrame(processingTimerRef.current);
        processingTimerRef.current = null;
      }
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    let frameCount = 0;
    
    // Process video frames
    const processVideoFrame = () => {
      frameCount++;
      setDetectFrameCount(frameCount);
      
      // Only process every few frames to reduce load
      if (frameCount % 3 === 0 && !processing) {
        setProcessing(true);
        
        // Use the DetectionService to process the current frame
        try {
          DetectionService.processVideo(video, canvas, handleDetectionResults);
        } catch (error) {
          console.error("Error processing video frame:", error);
        }
      }
      
      // Continue the animation loop
      processingTimerRef.current = requestAnimationFrame(processVideoFrame);
    };
    
    // Start processing frames
    processingTimerRef.current = requestAnimationFrame(processVideoFrame);
    
    // Clean up when disabled or unmounted
    return () => {
      if (processingTimerRef.current) {
        cancelAnimationFrame(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    };
  }, [objectDetectionEnabled, isLoaded, processing]);

  // Handle detection results
  const handleDetectionResults = (results: any) => {
    const now = Date.now();
    // Save the latest detection results
    detectionResultsRef.current = results;
    
    // Throttle updates to avoid overwhelming the UI
    if (now - lastDetectionTime.current > 100) {
      lastDetectionTime.current = now;
      
      if (results.objects && Array.isArray(results.objects)) {
        // Update detected objects in navigation context
        updateDetectedObjects(results.objects);
      }
      
      if (results.lanes) {
        // Update lane offset in navigation context
        updateLaneOffset(results.lanes);
      }
    }
    
    // Reset processing flag after a short delay
    setTimeout(() => setProcessing(false), 50);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveMapApiKey = () => {
    if (mapApiKey.trim()) {
      localStorage.setItem('mapApiKey', mapApiKey);
      setShowMapApiInput(false);
      toast({
        title: "API key saved",
        description: "Map API key has been saved successfully"
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid API key",
        description: "Please enter a valid API key"
      });
    }
  };

  const toggleObjectDetection = () => {
    setObjectDetectionEnabled(!objectDetectionEnabled);
    toast({
      title: objectDetectionEnabled ? "Object Detection Disabled" : "Object Detection Enabled",
      description: objectDetectionEnabled ? 
        "Object detection has been turned off" : 
        "Object detection is now active"
    });
    
    // Force CO2 update when detection is toggled on
    if (!objectDetectionEnabled) {
      updateCO2Savings();
    }
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className || ''}`}>
      {/* Main video element */}
      <video
        ref={videoRef}
        src={videoSrc}
        loop
        muted
        playsInline
        className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Canvas overlay for object detection */}
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full object-cover ${objectDetectionEnabled ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Loading/error states */}
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

      {/* Map API key input modal */}
      {showMapApiInput && (
        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-20 p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Map API Key</h3>
            <p className="text-sm text-gray-400 mb-4">
              Please enter your Google Maps API key to enable route visualization
            </p>
            <Input
              value={mapApiKey}
              onChange={(e) => setMapApiKey(e.target.value)}
              placeholder="Enter Google Maps API Key"
              className="mb-4"
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowMapApiInput(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMapApiKey} className="bg-navigation">
                Save & Enable
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <Button 
          onClick={triggerFileInput} 
          variant="secondary" 
          size="sm" 
          className="bg-black/50 hover:bg-black/70"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
        
        <Button 
          onClick={toggleObjectDetection}
          variant={objectDetectionEnabled ? "destructive" : "secondary"}
          size="sm" 
          className={objectDetectionEnabled ? "" : "bg-black/50 hover:bg-black/70"}
        >
          {objectDetectionEnabled ? "Disable Detection" : "Enable Detection"}
        </Button>
        
        <input 
          ref={fileInputRef}
          type="file" 
          accept="video/*" 
          onChange={handleFileUpload} 
          className="hidden" 
        />
      </div>
      
      {/* Processing indicator */}
      {processing && (
        <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded-full text-xs text-white flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
          Processing frame {detectFrameCount}
        </div>
      )}
      
      {/* Detection status indicator */}
      {objectDetectionEnabled && isLoaded && (
        <div className="absolute bottom-4 right-4 bg-green-600/70 px-3 py-1 rounded-full text-xs text-white flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          Traffic Detection Active
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
