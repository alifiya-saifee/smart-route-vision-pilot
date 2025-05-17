
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera, CameraOff, Hospital } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

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
  triggerEmergency
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce function to prevent rapid clicks
  const debounce = (func: Function, delay = 500) => {
    return (...args: any[]) => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      
      clickTimerRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset the input value after handling the file
      if (event.target) {
        event.target.value = '';
      }
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
            disabled={!toggleCameraStream}
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
          disabled={isCameraActive}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
        
        <Button 
          onClick={handleToggleObjectDetection}
          variant={objectDetectionEnabled ? "destructive" : "secondary"}
          size="sm" 
          className={objectDetectionEnabled ? "" : "bg-black/50 hover:bg-black/70"}
        >
          {objectDetectionEnabled ? "Disable Detection" : "Enable Detection"}
        </Button>
        
        {objectDetectionEnabled && triggerEmergency && (
          <Button 
            onClick={handleEmergency}
            variant="destructive"
            size="sm"
            className="bg-red-500 hover:bg-red-600"
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
    </>
  );
};

export default VideoControls;
