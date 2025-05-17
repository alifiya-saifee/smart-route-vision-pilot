
import React, { useRef, useState } from 'react';
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

  // Debounce function to prevent rapid clicks with loading state
  const debounce = (func: Function, delay = 800) => {
    return (...args: any[]) => {
      if (clickTimerRef.current || isActionInProgress) {
        return;
      }
      
      setIsActionInProgress(true);
      
      // Execute function after brief delay to prevent race conditions
      clickTimerRef.current = setTimeout(() => {
        func(...args);
        
        // Reset after a slightly longer delay to prevent rapid clicking
        setTimeout(() => {
          setIsActionInProgress(false);
          clickTimerRef.current = null;
        }, 300);
      }, delay);
    };
  };

  const triggerFileInput = () => {
    if (!isActionInProgress && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && !isActionInProgress) {
      setIsActionInProgress(true);
      
      setTimeout(() => {
        onFileUpload(file);
        
        // Reset the input value after handling the file
        if (event.target) {
          event.target.value = '';
        }
        
        setTimeout(() => {
          setIsActionInProgress(false);
        }, 500);
      }, 100);
    }
  };
  
  const handleToggleCamera = debounce(() => {
    if (toggleCameraStream) {
      toggleCameraStream();
    }
  });
  
  const handleEmergency = debounce(() => {
    if (triggerEmergency) {
      triggerEmergency();
      toast({
        title: "Emergency Mode Activated",
        description: "Scanning for nearest emergency services",
        variant: "destructive"
      });
    }
  });
  
  const handleToggleObjectDetection = debounce(() => {
    toggleObjectDetection();
  });
  
  const handleThresholdChange = (value: number[]) => {
    if (setConfidenceThreshold && !isActionInProgress) {
      setIsActionInProgress(true);
      
      setTimeout(() => {
        setConfidenceThreshold(value[0]);
        
        toast({
          title: "Detection Threshold Updated",
          description: `Now showing objects with ${Math.round(value[0] * 100)}% confidence or higher`,
          variant: "default"
        });
        
        setTimeout(() => {
          setIsActionInProgress(false);
        }, 300);
      }, 100);
    }
  };

  // Clean up timers when component unmounts
  React.useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    };
  }, []);

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
          onClick={triggerFileInput} 
          variant="secondary" 
          size="sm" 
          className="bg-black/50 hover:bg-black/70"
          disabled={isCameraActive || isActionInProgress}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
        
        <Button 
          onClick={handleToggleObjectDetection}
          variant={objectDetectionEnabled ? "destructive" : "secondary"}
          size="sm" 
          className={objectDetectionEnabled ? "" : "bg-black/50 hover:bg-black/70"}
          disabled={isActionInProgress}
        >
          {objectDetectionEnabled ? "Disable Detection" : "Enable Detection"}
        </Button>

        {objectDetectionEnabled && setConfidenceThreshold && (
          <Popover 
            open={thresholdPopoverOpen} 
            onOpenChange={(open) => !isActionInProgress && setThresholdPopoverOpen(open)}
          >
            <PopoverTrigger asChild>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-black/50 hover:bg-black/70"
                disabled={isActionInProgress}
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
            onClick={handleEmergency}
            variant="destructive"
            size="sm"
            className="bg-red-500 hover:bg-red-600"
            disabled={isActionInProgress}
          >
            <Hospital className="mr-2 h-4 w-4" />
            Emergency
          </Button>
        )}
        
        <input 
          ref={fileInputRef}
          type="file" 
          accept="video/*" 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </div>
      
      {/* Processing indicator - show real-time status */}
      {processing && objectDetectionEnabled && (
        <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded-full text-xs text-white flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Real-time detection: frame {detectFrameCount}
        </div>
      )}
      
      {/* Detection status indicator */}
      {objectDetectionEnabled && isLoaded && (
        <div className="absolute bottom-4 right-4 bg-green-600/70 px-3 py-1 rounded-full text-xs text-white flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          Traffic Detection Active {confidenceThreshold && `(${Math.round(confidenceThreshold * 100)}% threshold)`}
        </div>
      )}
    </>
  );
};

export default VideoControls;
