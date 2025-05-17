import React, { useEffect, useRef, useState } from 'react';
import { Clock, Camera, CameraOff, Hospital } from 'lucide-react';

interface VideoCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  objectDetectionEnabled: boolean;
  onToggleCamera?: () => void;
  isCameraActive?: boolean;
}

const VideoCanvas: React.FC<VideoCanvasProps> = ({ 
  canvasRef,
  videoRef,
  objectDetectionEnabled,
  onToggleCamera,
  isCameraActive = false
}) => {
  // FPS counter for performance monitoring
  const fpsRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(Date.now());
  const fpsDisplayRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  const [timeDisplay, setTimeDisplay] = useState<string>('');
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const emergencyEventHandled = useRef<boolean>(false);
  
  // Initialize canvas size when video dimensions are available
  useEffect(() => {
    const videoElement = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas || !videoElement || !videoElement.videoWidth) return;
    
    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth || videoElement.clientWidth;
    canvas.height = videoElement.videoHeight || videoElement.clientHeight;
  }, [canvasRef, videoRef]);
  
  // Update time display
  useEffect(() => {
    const timeInterval = setInterval(() => {
      const now = new Date();
      setTimeDisplay(now.toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);
  
  // Set up FPS counter and emergency mode handling
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
    
    // Handle emergency event detection
    const handleEmergencyEvent = (e: Event) => {
      // Prevent duplicate events
      if (emergencyEventHandled.current) return;
      emergencyEventHandled.current = true;
      
      const customEvent = e as CustomEvent;
      console.log('Emergency detected, starting recording', customEvent.detail);
      
      // Use setTimeout to avoid immediate state updates that could conflict with rendering
      setTimeout(() => {
        setIsRecording(true);
        setEmergencyActive(true);
        
        // Set simulated nearby hospitals
        setNearbyHospitals([
          { type: "hospital", name: "Memorial Hospital", distance: "1.2 miles", direction: "ahead" },
          { type: "hospital", name: "City Medical Center", distance: "2.8 miles", direction: "right" }
        ]);
        
        // Simulate emergency data gathering
        setTimeout(() => {
          // In a real implementation this would continue recording until the emergency is over
          setEmergencyActive(false);
          // Keep recording for a few more seconds
          setTimeout(() => {
            setIsRecording(false);
            // Keep showing hospitals for a bit longer
            setTimeout(() => {
              setNearbyHospitals([]);
              emergencyEventHandled.current = false; // Reset for future events
            }, 5000);
          }, 10000);
        }, 5000);
      }, 100);
    };
    
    // Add the event listener
    window.addEventListener('emergency-detected', handleEmergencyEvent);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('emergency-detected', handleEmergencyEvent);
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
      
      {/* FPS counter, time and recording indicator */}
      {objectDetectionEnabled && (
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center bg-black/50 text-white px-2 py-1 text-xs">
          <div
            ref={fpsDisplayRef}
            className={`${isRecording ? 'text-red-400' : 'text-green-400'} px-2 py-1 text-xs rounded font-mono flex items-center`}
          >
            {isRecording && (
              <div className="w-2 h-2 bg-red-100 rounded-full mr-2 animate-pulse"></div>
            )}
            -- FPS
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{timeDisplay}</span>
          </div>
          
          {onToggleCamera && (
            <button 
              onClick={onToggleCamera}
              className="bg-blue-500/50 hover:bg-blue-600/70 rounded-full p-1"
            >
              {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </button>
          )}
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
      
      {/* Hospital or emergency services indicators */}
      {objectDetectionEnabled && nearbyHospitals.length > 0 && (
        <div className="absolute bottom-4 left-4 flex flex-col gap-2">
          {nearbyHospitals.map((hospital, index) => (
            <EmergencyServiceIndicator 
              key={index} 
              name={hospital.name} 
              distance={hospital.distance} 
              direction={hospital.direction}
            />
          ))}
        </div>
      )}
      
      {/* Regular POI indicators when detected (only show when not in emergency mode) */}
      {objectDetectionEnabled && nearbyHospitals.length === 0 && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <PointOfInterestIndicator type="hospital" distance="1.2km" direction="ahead" />
          <PointOfInterestIndicator type="gas" distance="0.8km" direction="right" />
        </div>
      )}
    </>
  );
};

// Component for showing emergency services (hospitals, police, etc.)
const EmergencyServiceIndicator = ({ 
  name,
  distance, 
  direction 
}: { 
  name: string;
  distance: string; 
  direction: string 
}) => {
  return (
    <div className="bg-red-500/90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 animate-pulse">
      <Hospital className="w-5 h-5" />
      <div className="flex flex-col">
        <span className="font-bold">{name}</span>
        <div className="flex text-xs">
          <span>{distance}</span>
          <span className="mx-1">•</span>
          <span>{direction}</span>
        </div>
      </div>
    </div>
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
