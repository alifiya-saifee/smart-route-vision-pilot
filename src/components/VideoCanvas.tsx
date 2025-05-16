import React, { useEffect, useRef, useState } from 'react';

interface VideoCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  objectDetectionEnabled: boolean;
}

const VideoCanvas: React.FC<VideoCanvasProps> = ({ 
  canvasRef,
  videoRef,
  objectDetectionEnabled
}) => {
  // FPS counter for performance monitoring
  const fpsRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(Date.now());
  const fpsDisplayRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  
  // Initialize canvas size when video dimensions are available
  useEffect(() => {
    const videoElement = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas || !videoElement || !videoElement.videoWidth) return;
    
    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth || videoElement.clientWidth;
    canvas.height = videoElement.videoHeight || videoElement.clientHeight;
  }, [canvasRef, videoRef]);
  
  // Set up FPS counter and recording logic
  useEffect(() => {
    if (!objectDetectionEnabled) {
      if (isRecording) {
        setIsRecording(false);
      }
      return;
    }
    
    const calculateFps = () => {
      frameCountRef.current++;
      const now = Date.now();
      
      // Update FPS counter every 500ms
      if (now - lastFpsUpdateRef.current > 500) {
        // Calculate FPS
        const elapsed = (now - lastFpsUpdateRef.current) / 1000;
        fpsRef.current = Math.round(frameCountRef.current / elapsed);
        
        // Update display if available
        if (fpsDisplayRef.current) {
          fpsDisplayRef.current.textContent = `${fpsRef.current} FPS ${isRecording ? '• REC' : ''}`;
        }
        
        // Reset counters
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
      
      // Request next frame
      requestAnimationFrame(calculateFps);
    };
    
    // Start FPS calculation
    const animationId = requestAnimationFrame(calculateFps);
    
    // Check for emergency conditions in another component
    window.addEventListener('emergency-detected', ((e: CustomEvent) => {
      if (!isRecording) {
        console.log('Emergency detected, starting recording');
        setIsRecording(true);
        setEmergencyActive(true);
        
        // Simulate emergency data gathering
        setTimeout(() => {
          // In a real implementation this would continue recording until the emergency is over
          setEmergencyActive(false);
          // Keep recording for a few more seconds
          setTimeout(() => {
            setIsRecording(false);
          }, 10000);
        }, 5000);
      }
    }) as EventListener);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('emergency-detected', ((e: CustomEvent) => {}) as EventListener);
    };
  }, [objectDetectionEnabled, isRecording]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full object-cover ${
          objectDetectionEnabled ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* FPS counter and recording indicator */}
      {objectDetectionEnabled && (
        <div
          ref={fpsDisplayRef}
          className={`absolute top-4 left-4 ${isRecording ? 'bg-red-600/90' : 'bg-black/70'} text-${isRecording ? 'white' : 'green-400'} px-2 py-1 text-xs rounded font-mono flex items-center`}
        >
          {isRecording && (
            <div className="w-2 h-2 bg-red-100 rounded-full mr-2 animate-pulse"></div>
          )}
          -- FPS
        </div>
      )}
      
      {/* Emergency alert overlay */}
      {emergencyActive && (
        <div className="absolute inset-0 border-4 border-red-600 animate-pulse pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600/90 text-white px-4 py-2 rounded-full text-lg font-bold">
            EMERGENCY RECORDING
          </div>
        </div>
      )}
      
      {/* POI indicators when detected */}
      {objectDetectionEnabled && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <PointOfInterestIndicator type="hospital" distance="1.2km" direction="ahead" />
          <PointOfInterestIndicator type="gas" distance="0.8km" direction="right" />
        </div>
      )}
    </>
  );
};

// Component for showing nearby points of interest
const PointOfInterestIndicator = ({ 
  type, 
  distance, 
  direction 
}: { 
  type: string; 
  distance: string; 
  direction: string 
}) => {
  // Only show POIs with random probability to simulate detection
  const shouldShow = Math.random() > 0.5;
  
  if (!shouldShow) return null;
  
  let bgColor = "bg-blue-500/80";
  let icon = "🏢";
  
  if (type === "hospital") {
    bgColor = "bg-red-500/80";
    icon = "🏥";
  } else if (type === "gas") {
    bgColor = "bg-green-500/80";
    icon = "⛽";
  }
  
  return (
    <div className={`${bgColor} text-white px-3 py-1 rounded-full text-xs flex items-center gap-1`}>
      <span>{icon}</span>
      <span>{type}</span>
      <span className="font-bold">{distance}</span>
      <span className="text-gray-200">({direction})</span>
    </div>
  );
};

export default VideoCanvas;
