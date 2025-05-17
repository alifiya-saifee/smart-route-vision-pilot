import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera, CameraOff, Hospital, BarChart2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface VideoControlsProps {
  onFileUpload: (file: File) => void;
  objectDetectionEnabled: boolean;
  toggleObjectDetection: () => void;
  processing: boolean;
  detectFrameCount: number;
  isLoaded: boolean;
  toggleCameraStream?: () => void;
  isCameraActive?: boolean;
  triggerEmergency?: () => void;
  confidenceThreshold?: number;
  setConfidenceThreshold?: (value: number) => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  onFileUpload,
  objectDetectionEnabled,
  toggleObjectDetection,
  processing,
  detectFrameCount,
  isLoaded,
  toggleCameraStream,
  isCameraActive = false,
  triggerEmergency,
  confidenceThreshold = 0.5,
  setConfidenceThreshold
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [thresholdPopoverOpen, setThresholdPopoverOpen] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const isMountedRef = useRef<boolean>(true);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  const instanceIdRef = useRef<string>(`controls-${Date.now()}`);

  // Helper to register cleanup functions
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.push(cleanupFn);
  }, []);

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      // First clean up any pending timers
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      
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
      
      // Set mounted flag to false
      isMountedRef.current = false;
    };
  }, []);

  // Debounce function to prevent rapid clicks with loading state
  const debounce = useCallback((func: Function, delay = 800) => {
    return (...args: any[]) => {
      if (clickTimerRef.current || isActionInProgress || !isMountedRef.current) {
        return;
      }
      
      setIsActionInProgress(true);
      
      // Execute function after brief delay to prevent race conditions
      clickTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        try {
          func(...args);
        } catch (error) {
          console.error("Action error:", error);
        }
        
        // Reset after a slightly longer delay to prevent rapid clicking
        if (isMountedRef.current) {
          setTimeout(() => {
            if (!isMountedRef.current) return;
            setIsActionInProgress(false);
            clickTimerRef.current = null;
          }, 300);
        }
      }, delay) as unknown as NodeJS.Timeout;
      
      // Register cleanup for this timer
      registerCleanup(() => {
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
      });
    };
  }, [isActionInProgress, registerCleanup]);

  const triggerFileInput = useCallback(() => {
    if (!isActionInProgress && fileInputRef.current && isMountedRef.current) {
      fileInputRef.current.click();
    }
  }, [isActionInProgress]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && !isActionInProgress && isMountedRef.current) {
      setIsActionInProgress(true);
      
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        onFileUpload(file);
        
        // Reset the input value after handling the file
        if (event.target && isMountedRef.current) {
          event.target.value = '';
        }
        
        if (isMountedRef.current) {
          setTimeout(() => {
            if (!isMountedRef.current) return;
            setIsActionInProgress(false);
          }, 500);
        }
      }, 100);
    }
  }, [isActionInProgress, onFileUpload]);
  
  const handleToggleCamera = useCallback(() => {
    if (toggleCameraStream && isMountedRef.current && !isActionInProgress) {
      setIsActionInProgress(true);
      
      // Add small delay for better stability
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        
        try {
          toggleCameraStream();
        } catch (error) {
          console.error("Error toggling camera:", error);
        }
        
        // Reset action state after a delay
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsActionInProgress(false);
        }, 500);
      });
    }
  }, [toggleCameraStream, isActionInProgress]);
  
  const handleEmergency = useCallback(() => {
    if (triggerEmergency && isMountedRef.current && !isActionInProgress) {
      setIsActionInProgress(true);
      
      // Use requestAnimationFrame for more stable state updates
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        
        try {
          triggerEmergency();
          
          if (isMountedRef.current) {
            toast({
              title: "Emergency Mode Activated",
              description: "Scanning for nearest emergency services",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error triggering emergency mode:", error);
        }
        
        // Reset action state after a delay
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsActionInProgress(false);
        }, 500);
      });
    }
  }, [triggerEmergency, toast, isActionInProgress]);
  
  const handleToggleObjectDetection = useCallback(() => {
    if (isMountedRef.current && !isActionInProgress) {
      setIsActionInProgress(true);
      
      // Use requestAnimationFrame for more stable state updates
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        
        try {
          toggleObjectDetection();
        } catch (error) {
          console.error("Error toggling object detection:", error);
        }
        
        // Reset action state after a delay
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsActionInProgress(false);
        }, 500);
      });
    }
  }, [toggleObjectDetection, isActionInProgress]);
  
  const handleThresholdChange = useCallback((value: number[]) => {
    if (setConfidenceThreshold && !isActionInProgress && isMountedRef.current) {
      setIsActionInProgress(true);
      
      // Use requestAnimationFrame for more stable state updates
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        
        try {
          setConfidenceThreshold(value[0]);
          
          if (isMountedRef.current) {
            toast({
              title: "Detection Threshold Updated",
              description: `Now showing objects with ${Math.round(value[0] * 100)}% confidence or higher`,
              variant: "default"
            });
          }
        } catch (error) {
          console.error("Error updating confidence threshold:", error);
        }
        
        // Reset action state after a delay
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsActionInProgress(false);
        }, 500);
      });
    }
  }, [setConfidenceThreshold, isActionInProgress, toast]);

  // Handle popover state safely
  const handleOpenPopoverChange = useCallback((open: boolean) => {
    if (!isMountedRef.current || isActionInProgress) return;
    
    // Use requestAnimationFrame for more stable state updates
    requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      setThresholdPopoverOpen(open);
    });
  }, [isActionInProgress]);

  // Stabilize IDs for child elements
  const instanceId = instanceIdRef.current;
  
  // Create stable ID keys for child elements
  const uploadButtonId = `upload-video-button-${instanceId}`;
  const detectionButtonId = `toggle-detection-button-${instanceId}`;
  const thresholdButtonId = `threshold-settings-button-${instanceId}`;
  const emergencyButtonId = `emergency-button-${instanceId}`;
  const processingId = `processing-indicator-${instanceId}`;
  const statusId = `detection-status-${instanceId}`;
  const fileInputId = `file-input-${instanceId}`;

  return (
    <>
      {/* Control buttons */}
      <div className="absolute top-16 right-4 z-10 flex flex-col space-y-2">
        {toggleCameraStream && (
          <Button 
            onClick={handleToggleCamera}
            variant={isCameraActive ? "destructive" : "secondary"} 
            size="sm" 
            className={`${isCameraActive ? "" : "bg-black/50 hover:bg-black/70"} flex items-center`}
            disabled={!toggleCameraStream || isActionInProgress}
            data-testid="camera-toggle-button"
          >
            {isCameraActive ? (
              <>
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Use Camera
              </>
            )}
          </Button>
        )}
        
        <Button 
          id={uploadButtonId}
          onClick={triggerFileInput} 
          variant="secondary" 
          size="sm" 
          className="bg-black/50 hover:bg-black/70"
          disabled={isCameraActive || isActionInProgress}
          data-testid="upload-video-button"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
        
        <Button 
          id={detectionButtonId}
          onClick={handleToggleObjectDetection}
          variant={objectDetectionEnabled ? "destructive" : "secondary"}
          size="sm" 
          className={objectDetectionEnabled ? "" : "bg-black/50 hover:bg-black/70"}
          disabled={isActionInProgress}
          data-testid="toggle-detection-button"
        >
          {objectDetectionEnabled ? "Disable Detection" : "Enable Detection"}
        </Button>

        {objectDetectionEnabled && setConfidenceThreshold && (
          <Popover 
            open={thresholdPopoverOpen} 
            onOpenChange={handleOpenPopoverChange}
          >
            <PopoverTrigger asChild>
              <Button 
                id={thresholdButtonId}
                variant="secondary" 
                size="sm" 
                className="bg-black/50 hover:bg-black/70"
                disabled={isActionInProgress}
                data-testid="threshold-settings-button"
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                {Math.round(confidenceThreshold * 100)}% Threshold
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" side="left">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Detection Confidence Threshold</h4>
                <p className="text-xs text-gray-500">
                  Objects with confidence below this threshold won't be shown.
                </p>
                <Slider
                  defaultValue={[confidenceThreshold]}
                  max={1}
                  min={0}
                  step={0.05}
                  value={[confidenceThreshold]}
                  onValueChange={handleThresholdChange}
                  className="my-2"
                  disabled={isActionInProgress}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {objectDetectionEnabled && triggerEmergency && (
          <Button 
            id={emergencyButtonId}
            onClick={handleEmergency}
            variant="destructive"
            size="sm"
            className="bg-red-500 hover:bg-red-600"
            disabled={isActionInProgress}
            data-testid="emergency-button"
          >
            <Hospital className="mr-2 h-4 w-4" />
            Emergency
          </Button>
        )}
        
        <input 
          id={fileInputId}
          ref={fileInputRef}
          type="file" 
          accept="video/*" 
          onChange={handleFileChange} 
          className="hidden" 
          data-testid="file-input"
        />
      </div>
      
      {/* Processing indicator - show real-time status */}
      {processing && objectDetectionEnabled && (
        <div 
          id={processingId} 
          className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded-full text-xs text-white flex items-center"
          data-testid="processing-indicator"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Real-time detection: frame {detectFrameCount}
        </div>
      )}
      
      {/* Detection status indicator */}
      {objectDetectionEnabled && isLoaded && (
        <div 
          id={statusId} 
          className="absolute bottom-4 right-4 bg-green-600/70 px-3 py-1 rounded-full text-xs text-white flex items-center"
          data-testid="detection-status"
        >
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          Traffic Detection Active {confidenceThreshold && `(${Math.round(confidenceThreshold * 100)}% threshold)`}
        </div>
      )}
    </>
  );
};

export default VideoControls;
