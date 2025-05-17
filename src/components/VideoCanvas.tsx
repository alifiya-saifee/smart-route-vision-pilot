import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
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
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const emergencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hospitalsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventAttachedRef = useRef<boolean>(false);
  
  // Use a callback for emergency event handler to maintain stable reference
  const handleEmergencyEvent = useCallback((e: Event) => {
    // Prevent actions if component is unmounted
    if (!isComponentMounted.current) return;
    
    // Prevent duplicate events
    if (emergencyEventHandled.current) return;
    emergencyEventHandled.current = true;
    
    const customEvent = e as CustomEvent;
    console.log('Emergency detected, starting recording', customEvent.detail);
    
    // Use Promise instead of nested timeouts for better control flow
    Promise.resolve().then(() => {
      if (!isComponentMounted.current) return Promise.reject('Component unmounted');
      
      // Update state safely
      setIsRecording(true);
      setEmergencyActive(true);
      
      // Set simulated nearby hospitals
      setNearbyHospitals([
        { type: "hospital", name: "Memorial Hospital", distance: "1.2 miles", direction: "ahead" },
        { type: "hospital", name: "City Medical Center", distance: "2.8 miles", direction: "right" }
      ]);
      
      return new Promise<void>(resolve => {
        if (!isComponentMounted.current) return;
        
        // Simulate emergency data gathering
        emergencyTimeoutRef.current = setTimeout(() => {
          if (!isComponentMounted.current) return;
          resolve();
        }, 5000) as unknown as NodeJS.Timeout;
      });
    }).then(() => {
      if (!isComponentMounted.current) return Promise.reject('Component unmounted');
      
      setEmergencyActive(false);
      
      // Keep recording for a few more seconds
      return new Promise<void>(resolve => {
        if (!isComponentMounted.current) return;
        
        recordingTimeoutRef.current = setTimeout(() => {
          if (!isComponentMounted.current) return;
          resolve();
        }, 5000) as unknown as NodeJS.Timeout;
      });
    }).then(() => {
      if (!isComponentMounted.current) return;
      
      setIsRecording(false);
      
      // Keep showing hospitals for a bit longer
      return new Promise<void>(resolve => {
        if (!isComponentMounted.current) return;
        
        hospitalsTimeoutRef.current = setTimeout(() => {
          if (!isComponentMounted.current) return;
          
          setNearbyHospitals([]);
          emergencyEventHandled.current = false; // Reset for future events
          resolve();
        }, 2000) as unknown as NodeJS.Timeout;
      });
    }).catch(error => {
      if (error !== 'Component unmounted') {
        console.error('Error in emergency handling:', error);
      }
      // Reset state if there was an error and component is still mounted
      if (isComponentMounted.current) {
        setIsRecording(false);
        setEmergencyActive(false);
        setNearbyHospitals([]);
        emergencyEventHandled.current = false;
      }
    });
  }, []);
  
  // Track component mount state and clean up all resources
  useEffect(() => {
    isComponentMounted.current = true;
    
    // Add event listener only once
    if (!eventAttachedRef.current) {
      eventAttachedRef.current = true;
      window.addEventListener('emergency-detected', handleEmergencyEvent);
    }
    
    return () => {
      // First set the flag to prevent any new operations
      isComponentMounted.current = false;
      
      // Clean up all timers and animations safely
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
      
      if (animationFrameIdRef.current !== null) {
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
      
      // Always remove event listeners - only if we attached them
      if (eventAttachedRef.current) {
        window.removeEventListener('emergency-detected', handleEmergencyEvent);
        eventAttachedRef.current = false;
      }
    };
  }, [handleEmergencyEvent]);
  
  // Initialize canvas size when video dimensions are available
  useLayoutEffect(() => {
    if (!isComponentMounted.current) return;
    
    const videoElement = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas || !videoElement) return;
    
    // Only set dimensions when video metadata is loaded
    const handleVideoMetadata = () => {
      if (!isComponentMounted.current || !canvas) return;
      
      // Set canvas dimensions to match video
      canvas.width = videoElement.videoWidth || videoElement.clientWidth || 640;
      canvas.height = videoElement.videoHeight || videoElement.clientHeight || 480;
    };
    
    // Set dimensions immediately if video is already loaded
    if (videoElement.videoWidth) {
      handleVideoMetadata();
    } else {
      // Otherwise wait for metadata to load
      videoElement.addEventListener('loadedmetadata', handleVideoMetadata);
      
      // Clean up listener
      return () => {
        if (videoElement) {
          videoElement.removeEventListener('loadedmetadata', handleVideoMetadata);
        }
      };
    }
  }, [canvasRef, videoRef]);
  
  // Update time display with better cleanup
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
    
    // Initial time display
    const now = new Date();
    setTimeDisplay(now.toLocaleTimeString());
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    };
  }, []);
  
  // Set up FPS counter with better cleanup and safe animation frame handling
  useEffect(() => {
    if (!isComponentMounted.current) return;
    
    // First, clean up any existing animation frame
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    if (!objectDetectionEnabled) {
      if (isRecording && isComponentMounted.current) {
        setIsRecording(false);
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
    
    // Start FPS calculation if component is mounted
    if (isComponentMounted.current) {
      animationFrameIdRef.current = requestAnimationFrame(calculateFps);
    }
    
    // Cleanup
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [objectDetectionEnabled, isRecording]);
  
  // Generate unique and stable keys for components
  const canvasKey = `detection-canvas-${objectDetectionEnabled ? 'enabled' : 'disabled'}-${isCameraActive ? 'camera' : 'video'}`;
  const hudKey = `video-hud-${objectDetectionEnabled ? 'enabled' : 'disabled'}-${isRecording ? 'recording' : 'normal'}`;
  const emergencyKey = `emergency-alert-${emergencyActive ? 'active' : 'inactive'}`;
  const hospitalsKey = `hospitals-container-${nearbyHospitals.length}`;

  // Add stable and unique keys for each element to prevent React reconciliation issues
  return (
    <>
      {canvasRef && (
        <canvas
          key={canvasKey}
          ref={canvasRef}
          className={`absolute top-0 left-0 w-full h-full object-cover ${
            objectDetectionEnabled ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      
      {/* FPS counter, time and recording indicator - with stable key */}
      {objectDetectionEnabled && (
        <div 
          key={hudKey}
          className="absolute top-0 left-0 right-0 flex justify-between items-center bg-black/50 text-white px-2 py-1 text-xs"
        >
          <div
            id="fps-counter"
            ref={fpsDisplayRef}
            className={`${isRecording ? 'text-red-400' : 'text-green-400'} px-2 py-1 text-xs rounded font-mono flex items-center`}
          >
            {isRecording && (
              <div className="w-2 h-2 bg-red-100 rounded-full mr-2 animate-pulse"></div>
            )}
            -- FPS
          </div>
          
          <div id="time-display" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{timeDisplay}</span>
          </div>
          
          {onToggleCamera && (
            <button 
              id="camera-toggle-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onToggleCamera && isComponentMounted.current) onToggleCamera();
              }}
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
        <div 
          key={emergencyKey}
          className="absolute inset-0 border-4 border-red-600 animate-pulse pointer-events-none"
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600/90 text-white px-4 py-2 rounded-full text-lg font-bold">
            EMERGENCY RECORDING
          </div>
        </div>
      )}
      
      {/* Hospital or emergency services indicators */}
      {objectDetectionEnabled && nearbyHospitals.length > 0 && isComponentMounted.current && (
        <div 
          key={hospitalsKey}
          className="absolute bottom-4 left-4 flex flex-col gap-2"
        >
          {nearbyHospitals.map((hospital, index) => (
            <EmergencyServiceIndicator 
              key={`emergency-service-${index}-${hospital.name}`} 
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
          {/* Generate stable keys based on type and properties */}
          <PointOfInterestIndicator key="poi-hospital-1.2km" type="hospital" distance="1.2km" direction="ahead" />
          <PointOfInterestIndicator key="poi-gas-0.8km" type="gas" distance="0.8km" direction="right" />
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
