
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigation } from '@/context/NavigationContext';

// Mock video URL - this would normally be a real video stream or webcam feed
const MOCK_VIDEO_URL = "https://static.videezy.com/system/resources/previews/000/037/754/original/main.mp4";

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
  const [yoloApiKey, setYoloApiKey] = useState<string>(() => {
    return localStorage.getItem('yoloApiKey') || '';
  });
  const [showYoloApiInput, setShowYoloApiInput] = useState<boolean>(!localStorage.getItem('yoloApiKey'));
  const { toast } = useToast();
  const { updateDetectedObjects } = useNavigation();
  const [detectFrameCount, setDetectFrameCount] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    
    // Handle successful loading
    const handleCanPlay = () => {
      setIsLoaded(true);
      setError(null);
      console.log("Video can play now");
      
      // Initialize canvas size if object detection is enabled
      if (objectDetectionEnabled && canvasRef.current) {
        canvasRef.current.width = videoElement.videoWidth;
        canvasRef.current.height = videoElement.videoHeight;
      }
    };
    
    // Handle errors
    const handleError = (e: Event) => {
      console.error("Video error:", e);
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
  }, [videoSrc, objectDetectionEnabled]);

  // Handle object detection processing
  useEffect(() => {
    if (!objectDetectionEnabled || !isLoaded || !videoRef.current || !canvasRef.current) return;
    
    let animationFrameId: number;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Process every Nth frame to reduce load
    let frameCount = 0;
    const detectEveryNFrames = 30; // Detect objects every 30 frames (about 1-2 seconds at normal FPS)
    
    const processFrame = () => {
      // Draw the current video frame on the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      frameCount++;
      setDetectFrameCount(frameCount);
      
      // Only run detection periodically to reduce load
      if (frameCount % detectEveryNFrames === 0 && !processing) {
        runObjectDetection(canvas);
      }
      
      animationFrameId = requestAnimationFrame(processFrame);
    };
    
    processFrame();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [objectDetectionEnabled, isLoaded, processing]);

  // Function to simulate object detection
  // In a real implementation, this would call a YOLO model API
  const runObjectDetection = async (canvas: HTMLCanvasElement) => {
    const apiKey = localStorage.getItem('yoloApiKey');
    if (!apiKey) return;
    
    setProcessing(true);
    
    try {
      // This would be a real API call to a YOLO service
      // For now, we'll simulate a detection with random objects
      
      // In a real implementation, you'd:
      // 1. Get the canvas image data
      // const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // 2. Send to API
      // const response = await fetch('https://your-yolo-api.com/detect', {
      //   method: 'POST',
      //   headers: { 
      //     'Authorization': `Bearer ${apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ image: imageData })
      // });
      // const data = await response.json();
      
      // Simulate API response delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate detection results
      const simulatedObjects = [
        { type: 'car', count: Math.floor(Math.random() * 5) + 1 },
        { type: 'person', count: Math.floor(Math.random() * 3) },
        { type: 'traffic light', count: Math.floor(Math.random() * 2) },
      ];
      
      // Randomly add other objects
      if (Math.random() > 0.7) simulatedObjects.push({ type: 'truck', count: 1 });
      if (Math.random() > 0.8) simulatedObjects.push({ type: 'bus', count: 1 });
      if (Math.random() > 0.7) simulatedObjects.push({ type: 'bicycle', count: Math.floor(Math.random() * 2) });
      if (Math.random() > 0.9) simulatedObjects.push({ type: 'stop sign', count: 1 });
      
      // Draw bounding boxes on canvas (simulated)
      simulatedObjects.forEach(obj => {
        // In a real implementation, we'd use actual coordinates from the API
        // For simulation, we'll draw boxes in random positions
        drawSimulatedBox(ctx, canvas.width, canvas.height, obj.type);
      });
      
      // Update navigation context with detected objects
      updateDetectedObjects(simulatedObjects);
      
    } catch (err) {
      console.error("Error in object detection:", err);
      toast({
        variant: "destructive",
        title: "Object Detection Error",
        description: "Failed to process video frame"
      });
    }
    
    setProcessing(false);
  };

  // Helper function to draw simulated bounding boxes
  const drawSimulatedBox = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    objectType: string
  ) => {
    const x = Math.floor(Math.random() * (width - 100));
    const y = Math.floor(Math.random() * (height - 100));
    const boxWidth = Math.floor(Math.random() * 100) + 50;
    const boxHeight = Math.floor(Math.random() * 100) + 50;
    
    // Set color based on object type
    let color = '#00ff00'; // default green
    if (objectType === 'car' || objectType === 'truck' || objectType === 'bus') {
      color = '#ff0000'; // red for vehicles
    } else if (objectType === 'person' || objectType === 'bicycle') {
      color = '#0000ff'; // blue for people/bikes
    } else if (objectType === 'traffic light' || objectType === 'stop sign') {
      color = '#ffff00'; // yellow for signs
    }
    
    // Draw rectangle
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, boxWidth, boxHeight);
    
    // Draw label background
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 20, objectType.length * 8 + 20, 20);
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText(objectType, x + 5, y - 5);
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
      toast({
        title: "Video uploaded",
        description: `Now playing: ${file.name}`,
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveYoloApiKey = () => {
    if (yoloApiKey.trim()) {
      localStorage.setItem('yoloApiKey', yoloApiKey);
      setShowYoloApiInput(false);
      setObjectDetectionEnabled(true);
      toast({
        title: "API key saved",
        description: "Object detection has been enabled"
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
    if (!localStorage.getItem('yoloApiKey')) {
      setShowYoloApiInput(true);
      return;
    }
    
    setObjectDetectionEnabled(!objectDetectionEnabled);
    toast({
      title: objectDetectionEnabled ? "Object Detection Disabled" : "Object Detection Enabled",
      description: objectDetectionEnabled ? 
        "YOLO object detection has been turned off" : 
        "YOLO object detection is now active"
    });
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
        className={`w-full h-full object-cover ${isLoaded && !objectDetectionEnabled ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Canvas overlay for object detection */}
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full object-cover ${isLoaded && objectDetectionEnabled ? 'opacity-100' : 'opacity-0'}`}
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

      {/* YOLO API key input modal */}
      {showYoloApiInput && (
        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-20 p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Object Detection API Key</h3>
            <p className="text-sm text-gray-400 mb-4">
              Please enter your YOLO API key to enable object detection
            </p>
            <Input
              value={yoloApiKey}
              onChange={(e) => setYoloApiKey(e.target.value)}
              placeholder="Enter YOLO API Key"
              className="mb-4"
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowYoloApiInput(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveYoloApiKey} className="bg-navigation">
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
    </div>
  );
};

export default VideoFeed;
