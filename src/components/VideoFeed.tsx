
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
  const pendingOperationRef = useRef<boolean>(false);
  const unmountingRef = useRef<boolean>(false);
  const safeOperationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle saving the map API key with debounce
  const handleSaveMapApiKey = useCallback(() => {
    if (!isMountedRef.current || unmountingRef.current) return;
    
    localStorage.setItem('mapApiKey', mapApiKey);
    setShowMapApiInput(false);
    toast({
      title: "API key saved",
      description: "Map API key has been saved successfully"
    });
  }, [mapApiKey, toast]);

  // Track component mount state with better unmounting protection
  useEffect(() => {
    isMountedRef.current = true;
    unmountingRef.current = false;
    
    return () => {
      // Signal component is unmounting
      unmountingRef.current = true;
      
      // Clean up any pending timeouts
      if (safeOperationTimeoutRef.current) {
        clearTimeout(safeOperationTimeoutRef.current);
        safeOperationTimeoutRef.current = null;
      }
      
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
      
      // Finally set mounted flag to false
      isMountedRef.current = false;
    };
  }, []);

  // Safe camera toggle with improved debouncing and state management
  const safeToggleCameraStream = useCallback(() => {
    if (!isMountedRef.current || unmountingRef.current || isUpdatingVideo || pendingOperationRef.current) return;
    
    // Set flags to prevent multiple toggles
    setIsUpdatingVideo(true);
    pendingOperationRef.current = true;
    
    // Use Promise-based approach for better control flow
    Promise.resolve().then(() => {
      if (!isMountedRef.current || unmountingRef.current) return;
      
      // Call the actual toggle function
      toggleCameraStream();
      
      // Return a promise that resolves after a delay
      return new Promise<void>(resolve => {
        if (safeOperationTimeoutRef.current) {
          clearTimeout(safeOperationTimeoutRef.current);
        }
        
        safeOperationTimeoutRef.current = setTimeout(() => {
          resolve();
        }, 800) as unknown as NodeJS.Timeout;
      });
    }).then(() => {
      if (isMountedRef.current && !unmountingRef.current) {
        setIsUpdatingVideo(false);
        pendingOperationRef.current = false;
      }
    }).catch(error => {
      console.error("Error toggling camera:", error);
      // Reset state on error
      if (isMountedRef.current && !unmountingRef.current) {
        setIsUpdatingVideo(false);
        pendingOperationRef.current = false;
      }
    });
  }, [toggleCameraStream, isUpdatingVideo]);

  // Safe file upload with improved safety and error handling
  const safeHandleFileUpload = useCallback((file: File) => {
    if (!isMountedRef.current || unmountingRef.current || isUpdatingVideo || pendingOperationRef.current) return;
    
    // Set flags to prevent multiple uploads
    setIsUpdatingVideo(true);
    pendingOperationRef.current = true;
    
    // Use Promise-based approach
    Promise.resolve().then(() => {
      if (!isMountedRef.current || unmountingRef.current) return;
      
      // Handle the file upload
      handleFileUpload(file);
      
      // Return a promise that resolves after a delay
      return new Promise<void>(resolve => {
        if (safeOperationTimeoutRef.current) {
          clearTimeout(safeOperationTimeoutRef.current);
        }
        
        safeOperationTimeoutRef.current = setTimeout(() => {
          resolve();
        }, 800) as unknown as NodeJS.Timeout;
      });
    }).then(() => {
      if (isMountedRef.current && !unmountingRef.current) {
        setIsUpdatingVideo(false);
        pendingOperationRef.current = false;
      }
    }).catch(error => {
      console.error("Error handling file upload:", error);
      // Reset state on error
      if (isMountedRef.current && !unmountingRef.current) {
        setIsUpdatingVideo(false);
        pendingOperationRef.current = false;
      }
    });
  }, [handleFileUpload, isUpdatingVideo]);

  // Handle visibility changes safely 
  useEffect(() => {
    if (!isMountedRef.current || unmountingRef.current) return;
    
    const handleVisibilityChange = () => {
      if (!isMountedRef.current || unmountingRef.current || pendingOperationRef.current) return;
      
      // Clear any pending timeout
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
      
      if (document.visibilityState === 'visible' && videoRef.current && !isCameraActive) {
        // Add a delay before attempting to play to ensure DOM is ready
        visibilityTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current || unmountingRef.current || !videoRef.current) return;
          
          videoRef.current.play().catch(error => {
            console.error("Error playing video:", error);
          });
          
          visibilityTimeoutRef.current = null;
        }, 300) as unknown as NodeJS.Timeout;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
    };
  }, [videoRef, isCameraActive]);

  // Create stable keys for elements to help React with reconciliation
  // Use a combination of state values that would require a re-render
  const videoKey = `video-${isCameraActive ? 'camera' : `file-${videoSrc.substring(videoSrc.lastIndexOf('/') + 1)}`}-${isLoaded ? 'loaded' : 'loading'}`;
  const videoCanvasKey = `canvas-${isCameraActive ? 'camera' : 'file'}-${objectDetectionEnabled ? 'detection' : 'normal'}-${isLoaded ? 'loaded' : 'loading'}`;
  const videoControlsKey = `controls-${isCameraActive ? 'camera' : 'file'}-${objectDetectionEnabled ? 'detection' : 'normal'}`;

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className || ''}`}>
      {/* Video element with stable key */}
      {videoRef && (
        <video
          ref={videoRef}
          src={!isCameraActive ? videoSrc : undefined}
          loop={!isCameraActive}
          muted
          playsInline
          autoPlay
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          key={videoKey}
        />
      )}
      
      {/* Canvas overlay with stable key */}
      {videoRef && canvasRef && isLoaded && (
        <VideoCanvas 
          key={videoCanvasKey}
          canvasRef={canvasRef}
          videoRef={videoRef} 
          objectDetectionEnabled={objectDetectionEnabled}
          onToggleCamera={safeToggleCameraStream}
          isCameraActive={isCameraActive}
        />
      )}
      
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

      {/* Video controls with stable key */}
      <VideoControls
        key={videoControlsKey}
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
