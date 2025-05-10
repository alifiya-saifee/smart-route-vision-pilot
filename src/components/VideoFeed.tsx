
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
  const [mapApiKey, setMapApiKey] = useState<string>(() => {
    return localStorage.getItem('mapApiKey') || '';
  });
  const [showMapApiInput, setShowMapApiInput] = useState<boolean>(!localStorage.getItem('mapApiKey'));
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
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Process every Nth frame to reduce load
    let frameCount = 0;
    const detectEveryNFrames = 30; // Detect objects every 30 frames (about 1-2 seconds at normal FPS)
    
    const processFrame = () => {
      // Draw the current video frame on the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      frameCount++;
      setDetectFrameCount(frameCount);
      
      // Only run detection periodically to reduce load
      if (frameCount % detectEveryNFrames === 0 && !processing) {
        runObjectDetection(canvas, context);
      }
      
      animationFrameId = requestAnimationFrame(processFrame);
    };
    
    processFrame();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [objectDetectionEnabled, isLoaded, processing]);

  // Function for object detection simulation or integration with custom models
  const runObjectDetection = async (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    if (!objectDetectionEnabled) return;
    
    setProcessing(true);
    
    try {
      // Enhanced object detection with traffic-specific classes
      const trafficObjects = [
        { type: 'car', count: Math.floor(Math.random() * 5) + 1, confidence: 0.92 },
        { type: 'person', count: Math.floor(Math.random() * 3), confidence: 0.89 },
        { type: 'traffic light', count: 1, color: ['red', 'yellow', 'green'][Math.floor(Math.random() * 3)], confidence: 0.95 },
        { type: 'stop sign', count: Math.random() > 0.7 ? 1 : 0, confidence: 0.97 },
      ];
      
      // Add more objects based on probability
      if (Math.random() > 0.6) trafficObjects.push({ type: 'truck', count: 1, confidence: 0.88 });
      if (Math.random() > 0.7) trafficObjects.push({ type: 'bus', count: 1, confidence: 0.85 });
      if (Math.random() > 0.6) trafficObjects.push({ type: 'bicycle', count: Math.floor(Math.random() * 2), confidence: 0.82 });
      if (Math.random() > 0.8) trafficObjects.push({ type: 'motorcycle', count: 1, confidence: 0.86 });
      if (Math.random() > 0.9) trafficObjects.push({ type: 'pedestrian crossing', count: 1, confidence: 0.91 });
      if (Math.random() > 0.85) trafficObjects.push({ type: 'construction', count: 1, confidence: 0.83 });
      if (Math.random() > 0.92) trafficObjects.push({ type: 'school zone', count: 1, confidence: 0.94 });
      
      // Clear previous drawings before redrawing
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
      
      // Draw bounding boxes for each detected object
      const detectedObjects = trafficObjects.filter(obj => obj.count > 0).map(obj => {
        // Transform to expected format for DetectedObject
        const detectedObj = {
          type: obj.type,
          count: obj.count,
          confidence: obj.confidence,
          color: (obj as any).color
        };
        
        // Draw the bounding box for this object
        drawRealisticDetectionBox(context, canvas.width, canvas.height, detectedObj);
        
        // Return just the fields compatible with DetectedObject type
        return {
          type: obj.type,
          count: obj.count
        };
      });
      
      // Update navigation context with detected objects
      updateDetectedObjects(detectedObjects);
      
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

  // More realistic detection box drawing
  const drawRealisticDetectionBox = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    object: any
  ) => {
    // Create a more deterministic but still varied position based on object type
    const objectTypeHash = object.type.split('').reduce((a, b) => {
      return a + b.charCodeAt(0);
    }, 0);
    
    const seed = objectTypeHash * 100;
    const x = (seed % (width - 150)) + 20;
    const y = ((seed * 3) % (height - 150)) + 20;
    const boxWidth = 80 + (objectTypeHash % 60);
    const boxHeight = 70 + (objectTypeHash % 50);
    
    // Set color based on object type and confidence
    let color = '#00ff00'; // default green
    
    if (object.type === 'traffic light' && object.color) {
      // Color based on traffic light state
      if (object.color === 'red') color = '#ff0000';
      else if (object.color === 'yellow') color = '#ffcc00';
      else color = '#00ff00'; // green
    } 
    else if (object.type === 'person' || object.type === 'pedestrian' || object.type === 'pedestrian crossing') {
      color = '#ff0066'; // pink/red for people - high attention
    }
    else if (['car', 'truck', 'bus'].includes(object.type)) {
      color = '#ff6600'; // orange for vehicles
    }
    else if (['bicycle', 'motorcycle'].includes(object.type)) {
      color = '#0099ff'; // blue for two-wheelers
    }
    else if (['stop sign', 'school zone'].includes(object.type)) {
      color = '#ff3300'; // bright red for important signs
    }
    else if (object.type === 'construction') {
      color = '#ffcc00'; // yellow for construction
    }
    
    // Create a semi-transparent fill
    ctx.fillStyle = `${color}33`; // 20% opacity
    ctx.fillRect(x, y, boxWidth, boxHeight);
    
    // Draw rectangle border
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);
    
    // Draw confidence percentage
    const confidence = object.confidence ? Math.round(object.confidence * 100) : 95;
    
    // Draw label background
    ctx.fillStyle = color;
    let label = `${object.type}`;
    if (object.type === 'traffic light' && object.color) {
      label += ` (${object.color})`;
    } else if (object.count > 1) {
      label += ` (${object.count})`;
    }
    label += ` ${confidence}%`;
    
    const labelWidth = ctx.measureText(label).width + 10;
    ctx.fillRect(x, y - 20, labelWidth, 20);
    
    // Draw label text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(label, x + 5, y - 5);
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
