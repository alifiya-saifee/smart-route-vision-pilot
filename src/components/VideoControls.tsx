
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Camera, Video, Upload } from 'lucide-react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface VideoControlsProps {
  onFileUpload: (file: File) => void;
  objectDetectionEnabled: boolean;
  toggleObjectDetection: () => void;
  processing: boolean;
  detectFrameCount: number;
  isLoaded: boolean;
  toggleCameraStream?: (() => void) | undefined;
  isCameraActive: boolean;
  triggerEmergency: () => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (value: number) => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({ 
  onFileUpload,
  objectDetectionEnabled,
  toggleObjectDetection,
  processing,
  detectFrameCount,
  isLoaded,
  toggleCameraStream,
  isCameraActive,
  triggerEmergency,
  confidenceThreshold,
  setConfidenceThreshold
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emergency, setEmergency] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onFileUpload(file);
    }
  };

  const handleEmergencyClick = () => {
    if (!emergency) {
      setEmergency(true);
      triggerEmergency();
      
      setTimeout(() => {
        setEmergency(false);
      }, 10000);
    }
  };

  const handleConfidenceChange = (value: number[]) => {
    setConfidenceThreshold(value[0]);
    
    // Show toast notification when threshold changes
    toast({
      title: `Confidence Threshold: ${Math.round(value[0] * 100)}%`,
      description: `Filtering objects below ${Math.round(value[0] * 100)}% confidence`
    });
  };

  return (
    <div className="navigation-panel">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium mb-0">Video Source</h3>
          <div className="flex flex-wrap gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="video/*"
              onChange={handleFileInputChange}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isLoaded}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
            {toggleCameraStream && (
              <Button 
                variant={isCameraActive ? "destructive" : "outline"} 
                size="sm"
                onClick={toggleCameraStream}
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                {isCameraActive ? "Stop Camera" : "Use Camera"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium mb-0">Detection Controls</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={objectDetectionEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleObjectDetection}
              disabled={!isLoaded}
              className="flex-1"
            >
              <Video className="mr-2 h-4 w-4" />
              {objectDetectionEnabled ? "Disable Detection" : "Enable Detection"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmergencyClick}
              disabled={emergency}
              className="flex-1"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Emergency
            </Button>
          </div>
        </div>

        <div className="space-y-3 col-span-1 md:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Confidence Threshold</h3>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
              {Math.round(confidenceThreshold * 100)}%
            </span>
          </div>
          <Slider
            value={[confidenceThreshold]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={handleConfidenceChange}
            className="w-full"
          />
          <p className="text-xs text-gray-400">
            Higher values show fewer but more accurate detections
          </p>
        </div>

        {objectDetectionEnabled && (
          <div className="col-span-1 md:col-span-2 bg-gray-800/50 rounded p-2">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-400">
                <span className="font-medium">Status:</span> 
                {processing 
                  ? <span className="text-yellow-400 ml-1">Processing...</span>
                  : <span className="text-green-400 ml-1">Ready</span>
                }
              </div>
              <div className="text-xs">
                <span className="text-gray-400">Frames: </span>
                <span className="text-blue-300">{detectFrameCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoControls;
