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
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  const instanceIdRef = useRef<string>(`canvas-${Date.now()}`);
  
  // Helper to register cleanup functions
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.push(cleanupFn);
  }, []);
  
  // Use a callback for emergency event handler to maintain stable reference
  const handleEmergencyEvent = useCallback((e: Event) => {
    // Prevent actions if component is unmounted
    if (!isComponentMounted.current) return;
    
    // Prevent duplicate events
    if (emergencyEventHandled.current) return;
    emergencyEventHandled.current = true;
    
    const customEvent = e as CustomEvent;
    console.log('Emergency detected, starting recording', customEvent.detail);
    
    // Set state synchronously to prevent React batching issues
    setIsRecording(true);
    setEmergencyActive(true);
    
    // Set simulated nearby hospitals
    setNearbyHospitals([
      { id: 'h1', type: "hospital", name: "Memorial Hospital", distance: "1.2 miles", direction: "ahead" },
      { id: 'h2', type: "hospital", name: "City Medical Center", distance: "2.8 miles", direction: "right" }
    ]);
    
    // Simulate emergency data gathering with proper cleanup registration
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
        }, 2000) as unknown as NodeJS.Timeout;
        
        // Register cleanup for hospitals timeout
        registerCleanup(() => {
          if (hospitalsTimeoutRef.current) {
            clearTimeout(hospitalsTimeoutRef.current);
            hospitalsTimeoutRef.current = null;
          }
        });
      }, 5000) as unknown as NodeJS.Timeout;
      
      // Register cleanup for recording timeout
      registerCleanup(() => {
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
      });
    }, 5000) as unknown as NodeJS.Timeout;
    
    // Register cleanup for emergency timeout
    registerCleanup(() => {
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
        emergencyTimeoutRef.current = null;
      }
    });
  }, [registerCleanup]);
  
  // Track component mount state and clean up all resources
  useEffect(() => {
    isComponentMounted.current = true;
    
    // Add event listener only once
    if (!eventAttachedRef.current) {
      eventAttachedRef.current = true;
      
      try {
        window.addEventListener('emergency-detected', handleEmergencyEvent);
      } catch (err) {
        console.error("Error adding emergency event listener:", err);
      }
      
      // Register cleanup for this event listener
      registerCleanup(() => {
        try {
          window.removeEventListener('emergency-detected', handleEmergencyEvent);
        } catch (err) {
          console.error("Error removing emergency event listener:", err);
        }
        eventAttachedRef.current = false;
      });
    }
    
    return () => {
      // First set the flag to prevent any new operations
      isComponentMounted.current = false;
      
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
      
      // Additional explicit cleanup to ensure everything is properly removed
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
      
      if (animationFrameIdRef.current !== null) {
        try {
          cancelAnimationFrame(animationFrameIdRef.current);
        } catch (err) {
          console.error("Error cancelling animation frame:", err);
        }
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
        try {
          window.removeEventListener('emergency-detected', handleEmergencyEvent);
        } catch (err) {
          console.error("Error removing emergency event listener:", err);
        }
        eventAttachedRef.current = false;
      }
    };
  }, [handleEmergencyEvent, registerCleanup]);
  
  // Initialize canvas size when video dimensions are available
  useLayoutEffect(() => {
    if (!isComponentMounted.current) return;
    
    const videoElement = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas || !videoElement) return;
    
    // Only set dimensions when video metadata is loaded
    const handleVideoMetadata = () => {
      if (!isComponentMounted.current || !canvas) return;
      
      try {
        // Set canvas dimensions to match video
        canvas.width = videoElement.videoWidth || videoElement.clientWidth || 640;
        canvas.height = videoElement.videoHeight || videoElement.clientHeight || 480;
      } catch (err) {
        console.error("Error setting canvas dimensions:", err);
      }
    };
    
    // Set dimensions immediately if video is already loaded
    if (videoElement.videoWidth) {
      handleVideoMetadata();
    } else {
      try {
        // Otherwise wait for metadata to load
        videoElement.addEventListener('loadedmetadata', handleVideoMetadata);
        
        // Register cleanup for this event listener
        registerCleanup(() => {
          if (videoElement) {
            try {
              videoElement.removeEventListener('loadedmetadata', handleVideoMetadata);
            } catch (err) {
              console.error("Error removing loadedmetadata listener:", err);
            }
          }
        });
      } catch (err) {
        console.error("Error adding loadedmetadata listener:", err);
      }
    }
    
    return () => {
      if (videoElement) {
        try {
          videoElement.removeEventListener('loadedmetadata', handleVideoMetadata);
        } catch (err) {
          console.error("Error removing loadedmetadata listener in cleanup:", err);
        }
      }
    };
  }, [canvasRef, videoRef, registerCleanup]);
  
  // Update time display with better cleanup
  useEffect(() => {
    if (!isComponentMounted.current) return;
    
    // Clear any existing interval first to prevent duplicates
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    try {
      // Set up new interval
      timeIntervalRef.current = setInterval(() => {
        if (!isComponentMounted.current) return;
        
        try {
          const now = new Date();
          setTimeDisplay(now.toLocaleTimeString());
        } catch (err) {
          console.error("Error updating time display:", err);
        }
      }, 1000);
      
      // Register cleanup for this interval
      registerCleanup(() => {
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      });
      
      // Initial time display
      const now = new Date();
      setTimeDisplay(now.toLocaleTimeString());
    } catch (err) {
      console.error("Error setting up time interval:", err);
    }
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    };
  }, [registerCleanup]);
  
  // Set up FPS counter with better cleanup and safe animation frame handling
  useEffect(() => {
    if (!isComponentMounted.current) return;
    
    // First, clean up any existing animation frame
    if (animationFrameIdRef.current !== null) {
      try {
        cancelAnimationFrame(animationFrameIdRef.current);
      } catch (err) {
        console.error("Error cancelling animation frame:", err);
      }
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
      
      try {
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
          try {
            animationFrameIdRef.current = requestAnimationFrame(calculateFps);
          } catch (err) {
            console.error("Error requesting animation frame:", err);
          }
        }
      } catch (err) {
        console.error("Error calculating FPS:", err);
        
        // Reset animation frame reference if there was an error
        animationFrameIdRef.current = null;
      }
    };
    
    // Start FPS calculation if component is mounted
    if (isComponentMounted.current) {
      try {
        animationFrameIdRef.current = requestAnimationFrame(calculateFps);
        
        // Register cleanup for this animation frame
        registerCleanup(() => {
          if (animationFrameIdRef.current !== null) {
            try {
              cancelAnimationFrame(animationFrameIdRef.current);
            } catch (err) {
              console.error("Error cancelling animation frame in cleanup:", err);
            }
            animationFrameIdRef.current = null;
          }
        });
      } catch (err) {
        console.error("Error requesting initial animation frame:", err);
      }
    }
    
    // Cleanup
    return () => {
      if (animationFrameIdRef.current !== null) {
        try {
          cancelAnimationFrame(animationFrameIdRef.current);
        } catch (err) {
          console.error("Error cancelling animation frame in cleanup:", err);
        }
        animationFrameIdRef.current = null;
      }
    };
  }, [objectDetectionEnabled, isRecording, registerCleanup]);
  
  // Generate unique and stable keys for components
  const instanceId = instanceIdRef.current;
  const canvasElementKey = `detection-canvas-${instanceId}-${objectDetectionEnabled ? 'enabled' : 'disabled'}-${isCameraActive ? 'camera' : 'video'}`;
  const hudKey = `video-hud-${instanceId}-${objectDetectionEnabled ? 'enabled' : 'disabled'}-${isRecording ? 'recording' : 'normal'}`;
  const emergencyKey = `emergency-alert-${instanceId}-${emergencyActive ? 'active' : 'inactive'}`;
  const hospitalsKey = `hospitals-container-${instanceId}-${nearbyHospitals.length}`;

  // Add stable and unique keys for each element to prevent React reconciliation issues
  return (
    <>
      {canvasRef && (
        <canvas
          key={canvasElementKey}
          ref={canvasRef}
          className={`absolute top-0 left-0 w-full h-full object-cover ${
            objectDetectionEnabled ? 'opacity-100' : 'opacity-0'
          }`}
          data-testid="detection-canvas"
        />
      )}
      
      {/* FPS counter, time and recording indicator - with stable key */}
      {objectDetectionEnabled && (
        <div 
          key={hudKey}
          className="absolute top-0 left-0 right-0 flex justify-between items-center bg-black/50 text-white px-2 py-1 text-xs"
          data-testid="video-hud"
        >
          <div
            id={`fps-counter-${instanceId}`}
            ref={fpsDisplayRef}
            className={`${isRecording ? 'text-red-400' : 'text-green-400'} px-2 py-1 text-xs rounded font-mono flex items-center`}
          >
            {isRecording && (
              <div className="w-2 h-2 bg-red-100 rounded-full mr-2 animate-pulse"></div>
            )}
            -- FPS
          </div>
          
          <div id={`time-display-${instanceId}`} className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{timeDisplay}</span>
          </div>
          
          {onToggleCamera && (
            <button 
              id={`camera-toggle-button-${instanceId}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onToggleCamera && isComponentMounted.current) onToggleCamera();
              }}
              className="bg-blue-500/50 hover:bg-blue-600/70 rounded-full p-1"
              type="button"
              data-testid="camera-toggle"
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
          data-testid="emergency-alert"
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
          data-testid="hospital-indicators"
        >
          {nearbyHospitals.map((hospital) => (
            <EmergencyServiceIndicator 
              key={`emergency-service-${instanceId}-${hospital.id || hospital.name}`} 
              name={hospital.name} 
              distance={hospital.distance} 
              direction={hospital.direction}
            />
          ))}
        </div>
      )}
      
      {/* Regular POI indicators when detected (only show when not in emergency mode) */}
      {objectDetectionEnabled && nearbyHospitals.length === 0 && isComponentMounted.current && (
        <div 
          key={`poi-container-${instanceId}`}
          className="absolute bottom-4 right-4 flex flex-col gap-2"
          data-testid="poi-indicators"
        >
          {/* Generate stable keys based on type and properties */}
          <PointOfInterestIndicator 
            key={`poi-${instanceId}-hospital-1.2km`} 
            type="hospital" 
            distance="1.2km" 
            direction="ahead" 
          />
          <PointOfInterestIndicator 
            key={`poi-${instanceId}-gas-0.8km`} 
            type="gas" 
            distance="0.8km" 
            direction="right" 
          />
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
  const uniqueId = useRef(`emergency-service-${name}-${Date.now()}`).current;
  
  return (
    <div 
      className="bg-red-500/90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 animate-pulse"
      key={uniqueId}
    >
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
  const uniqueId = useRef(`poi-${type}-${distance}-${Date.now()}`).current;
  
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
    <div 
      className={`${bgColor} text-white px-3 py-1 rounded-full text-xs flex items-center gap-1`}
      key={uniqueId}
    >
      <span>{icon}</span>
      <span>{type}</span>
      <span className="font-bold">{distance}</span>
      <span className="text-gray-200">({direction})</span>
    </div>
  );
};

export default VideoCanvas;
