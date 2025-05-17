import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { useObjectDetection } from '@/hooks/useObjectDetection';
import VideoCanvas from '@/components/VideoCanvas';
import VideoControls from '@/components/VideoControls';
import MapApiKeyModal from '@/components/MapApiKeyModal';

interface VideoFeedProps {
  className?: string;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ className }) => {
  const {
    videoRef,
    isLoaded,
    error,
    videoSrc,
    handleFileUpload,
    toggleCameraStream,
    isCameraActive
  } = useVideoProcessing();
  
  const {
    canvasRef,
    objectDetectionEnabled,
    detectFrameCount,
    processing,
    toggleObjectDetection,
    triggerEmergencyMode,
    confidenceThreshold,
    setConfidenceThreshold
  } = useObjectDetection();
  
  const [mapApiKey, setMapApiKey] = useState<string>(() => {
    return localStorage.getItem('mapApiKey') || '';
  });
  
  const [showMapApiInput, setShowMapApiInput] = useState<boolean>(!localStorage.getItem('mapApiKey'));
  const { toast } = useToast();
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);
  const isMountedRef = useRef<boolean>(true);

  const handleSaveMapApiKey = useCallback(() => {
    localStorage.setItem('mapApiKey', mapApiKey);
    setShowMapApiInput(false);
    toast({
      title: "API key saved",
      description: "Map API key has been saved successfully"
    });
  }, [mapApiKey, toast]);

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe camera toggle with debouncing to prevent race conditions
  const safeToggleCameraStream = useCallback(() => {
    if (!isMountedRef.current || isUpdatingVideo) return;
    
    // Set updating flag to prevent multiple toggles
    setIsUpdatingVideo(true);
    
    // Delay toggle to ensure React has finished rendering
    const toggleTimeout = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      toggleCameraStream();
      
      // Reset updating flag after a delay
      const resetTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          setIsUpdatingVideo(false);
        }
      }, 500);
      
      return () => clearTimeout(resetTimeout);
    }, 100); // Increased delay for better stability
    
    return () => clearTimeout(toggleTimeout);
  }, [toggleCameraStream, isUpdatingVideo]);

  // Safe file upload with debouncing to prevent race conditions
  const safeHandleFileUpload = useCallback((file: File) => {
    if (!isMountedRef.current || isUpdatingVideo) return;
    
    // Set updating flag to prevent multiple uploads
    setIsUpdatingVideo(true);
    
    // Delay upload to ensure React has finished rendering
    const uploadTimeout = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      handleFileUpload(file);
      
      // Reset updating flag after a delay
      const resetTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          setIsUpdatingVideo(false);
        }
      }, 500);
      
      return () => clearTimeout(resetTimeout);
    }, 100); // Increased delay for better stability
    
    return () => clearTimeout(uploadTimeout);
  }, [handleFileUpload, isUpdatingVideo]);

  // Ensure video keeps playing when tab regains focus with error handling and debouncing
  useEffect(() => {
    let visibilityTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;
      
      // Clear any pending timeout
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
        visibilityTimeout = null;
      }
      
      if (document.visibilityState === 'visible' && videoRef.current && !isCameraActive) {
        // Add a slight delay before attempting to play to ensure DOM is ready
        visibilityTimeout = setTimeout(() => {
          if (!isMountedRef.current || !videoRef.current) return;
          
          videoRef.current.play().catch(error => {
            console.error("Error playing video:", error);
          });
          
          visibilityTimeout = null;
        }, 200); // Longer delay for better stability
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
      
      isMountedRef.current = false;
    };
  }, [videoRef, isCameraActive]);

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className || ''}`}>
      {/* Main video element */}
      <video
        ref={videoRef}
        src={!isCameraActive ? videoSrc : undefined}
        loop={!isCameraActive}
        muted
        playsInline
        autoPlay
        className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        key={isCameraActive ? 'camera' : videoSrc} // Add key to force remounting
      />
      
      {/* Canvas overlay for object detection */}
      <VideoCanvas 
        canvasRef={canvasRef}
        videoRef={videoRef} 
        objectDetectionEnabled={objectDetectionEnabled}
        onToggleCamera={safeToggleCameraStream}
        isCameraActive={isCameraActive}
      />
      
      {/* Loading/error states */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-white">
          {error ? (
            <>
              <p className="text-lg font-medium text-red-400 mb-2">⚠️ {error}</p>
              <div className="w-60 h-40 border border-gray-600 rounded flex items-center justify-center bg-gray-700">
                <p className="text-sm text-gray-400">Video simulation</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg mb-2">Loading video feed...</p>
              <div className="animate-pulse w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
            </>
          )}
        </div>
      )}

      {/* Map API key input modal */}
      {showMapApiInput && (
        <MapApiKeyModal
          mapApiKey={mapApiKey}
          setMapApiKey={setMapApiKey}
          onSave={handleSaveMapApiKey}
          onCancel={() => setShowMapApiInput(false)}
        />
      )}

      {/* Video controls */}
      <VideoControls
        onFileUpload={safeHandleFileUpload}
        objectDetectionEnabled={objectDetectionEnabled}
        toggleObjectDetection={toggleObjectDetection}
        processing={processing}
        detectFrameCount={detectFrameCount}
        isLoaded={isLoaded}
        toggleCameraStream={!isUpdatingVideo ? safeToggleCameraStream : undefined}
        isCameraActive={isCameraActive}
        triggerEmergency={triggerEmergencyMode}
        confidenceThreshold={confidenceThreshold}
        setConfidenceThreshold={setConfidenceThreshold}
      />
    </div>
  );
};

export default VideoFeed;
