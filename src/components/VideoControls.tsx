
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface VideoControlsProps {
  onFileUpload: (file: File) => void;
  objectDetectionEnabled: boolean;
  toggleObjectDetection: () => void;
  processing: boolean;
  detectFrameCount: number;
  isLoaded: boolean;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  onFileUpload,
  objectDetectionEnabled,
  toggleObjectDetection,
  processing,
  detectFrameCount,
  isLoaded
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <>
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
