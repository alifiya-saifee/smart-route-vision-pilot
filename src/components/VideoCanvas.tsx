
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
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
  const isComponentMounted = useRef<boolean>(true);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const emergencyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hospitalsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track component mount state and clean up all resources
  // This needs to be the first effect to set up the mount flag
  useEffect(() => {
    isComponentMounted.current = true;
    
    return () => {
      // Signal component is unmounted to prevent further state updates
      isComponentMounted.current = false;
      
      // Clear all timers and animations to prevent memory leaks
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
      
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
        emergencyTimeoutRef.current = null;
      }
      
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      
      if (hospitalsTimeoutRef.current) {
        clearTimeout(hospitalsTimeoutRef.current);
        hospitalsTimeoutRef.current = null;
      }
      
      // Remove any event listeners
      window.removeEventListener('emergency-detected', handleEmergencyEvent);
    };
  }, []);
  
  // Initialize canvas size when video dimensions are available
  // Using useLayoutEffect to ensure canvas is sized before painting
  useLayoutEffect(() => {
    if (!isComponentMounted.current) return;
    
    const videoElement = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas || !videoElement || !videoElement.videoWidth) return;
    
    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth || videoElement.clientWidth;
    canvas.height = videoElement.videoHeight || videoElement.clientHeight;
  }, [canvasRef, videoRef]);
  
  // Update time display
  useEffect(() => {
    if (!isComponentMounted.current) return;
    
    // Clear any existing interval first to prevent duplicates
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    // Set up new interval
    timeIntervalRef.current = setInterval(() => {
      if (!isComponentMounted.current) return;
      
      const now = new Date();
      setTimeDisplay(now.toLocaleTimeString());
    }, 1000);
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    };
  }, []);
  
  // Set up FPS counter and emergency mode handling
  useEffect(() => {
    if (!isComponentMounted.current) return;
    
    if (!objectDetectionEnabled) {
      if (isRecording && isComponentMounted.current) {
        setIsRecording(false);
      }
      // Clean up animation frame if detection is disabled
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }
    
    const calculateFps = () => {
      if (!isComponentMounted.current) return;
      
      frameCountRef.current++;
      const now = Date.now();
      
      // Update FPS counter every 500ms
      if (now - lastFpsUpdateRef.current > 500) {
        // Calculate FPS
        const elapsed = (now - lastFpsUpdateRef.current) / 1000;
        fpsRef.current = Math.round(frameCountRef.current / elapsed);
        
        // Update display if available and component is mounted
        if (fpsDisplayRef.current && isComponentMounted.current) {
          fpsDisplayRef.current.textContent = `${fpsRef.current} FPS ${isRecording ? '• REC' : ''}`;
        }
        
        // Reset counters
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
      
      // Only request next frame if component is still mounted
      if (isComponentMounted.current) {
        animationFrameIdRef.current = requestAnimationFrame(calculateFps);
      }
    };
    
    // Start FPS calculation
    if (isComponentMounted.current) {
      // Clean up existing animation frame first
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      animationFrameIdRef.current = requestAnimationFrame(calculateFps);
    }
    
    // Remove any existing emergency event listeners to prevent duplicates
    window.removeEventListener('emergency-detected', handleEmergencyEvent);
    
    // Add the event listener only if component is mounted
    if (isComponentMounted.current) {
      window.addEventListener('emergency-detected', handleEmergencyEvent);
    }
    
    // Cleanup
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      window.removeEventListener('emergency-detected', handleEmergencyEvent);
    };
  }, [objectDetectionEnabled, isRecording]);
  
  // Handle emergency events safely
  const handleEmergencyEvent = (e: Event) => {
    // Prevent actions if component is unmounted
    if (!isComponentMounted.current) return;
    
    // Prevent duplicate events
    if (emergencyEventHandled.current) return;
    emergencyEventHandled.current = true;
    
    const customEvent = e as CustomEvent;
    console.log('Emergency detected, starting recording', customEvent.detail);
    
    // We'll use setTimeout with zero delay to push this to the next tick
    // This helps avoid React state update race conditions
    setTimeout(() => {
      if (!isComponentMounted.current) return;
      
      // Update state safely
      setIsRecording(true);
      setEmergencyActive(true);
      
      // Set simulated nearby hospitals
      setNearbyHospitals([
        { type: "hospital", name: "Memorial Hospital", distance: "1.2 miles", direction: "ahead" },
        { type: "hospital", name: "City Medical Center", distance: "2.8 miles", direction: "right" }
      ]);
      
      // Simulate emergency data gathering with safety checks
      emergencyTimeoutRef.current = setTimeout(() => {
        if (!isComponentMounted.current) return;
        
        setEmergencyActive(false);
        // Keep recording for a few more seconds
        recordingTimeoutRef.current = setTimeout(() => {
          if (!isComponentMounted.current) return;
          
          setIsRecording(false);
          // Keep showing hospitals for a bit longer
          hospitalsTimeoutRef.current = setTimeout(() => {
            if (!isComponentMounted.current) return;
            
            setNearbyHospitals([]);
            emergencyEventHandled.current = false; // Reset for future events
          }, 5000);
          
        }, 10000);
        
      }, 5000);
    }, 0);
  };

  return (
    <>
      {canvasRef && (
        <canvas
          ref={canvasRef}
          className={`absolute top-0 left-0 w-full h-full object-cover ${
            objectDetectionEnabled ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      
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
              type="button"
            >
              {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
      
      {/* Emergency alert overlay */}
      {emergencyActive && isComponentMounted.current && (
        <div className="absolute inset-0 border-4 border-red-600 animate-pulse pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600/90 text-white px-4 py-2 rounded-full text-lg font-bold">
            EMERGENCY RECORDING
          </div>
        </div>
      )}
      
      {/* Hospital or emergency services indicators */}
      {objectDetectionEnabled && nearbyHospitals.length > 0 && isComponentMounted.current && (
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
      {objectDetectionEnabled && nearbyHospitals.length === 0 && isComponentMounted.current && (
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
  // Use a ref to ensure the random value is stable across renders
  const shouldShowRef = useRef(Math.random() > 0.5);
  
  if (!shouldShowRef.current) return null;
  
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
