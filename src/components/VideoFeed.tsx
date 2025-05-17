
import React, { useEffect, useCallback, useRef } from 'react';
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { useObjectDetection } from '@/hooks/useObjectDetection';
import { useVideoSettings } from '@/hooks/useVideoSettings';
import { useSafeOperations } from '@/hooks/useSafeOperations';
import { useVideoState } from '@/components/video/VideoStateProvider';
import VideoControls from '@/components/VideoControls';
import MapApiKeyModal from '@/components/MapApiKeyModal';
import VideoMainDisplay from '@/components/video/VideoMainDisplay';

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
    isCameraActive,
    uniqueId
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
  
  const {
    mapApiKey,
    setMapApiKey,
    showMapApiInput,
    setShowMapApiInput,
    handleSaveMapApiKey
  } = useVideoSettings();
  
  const { isMounted, registerCleanup, createSafeHandler } = useSafeOperations();
  const { isUpdatingVideo, setIsUpdatingVideo } = useVideoState();
  
  const pendingOperationRef = useRef<boolean>(false);
  const unmountingRef = useRef<boolean>(false);
  const mountCounterRef = useRef<number>(0);
  const componentId = useRef<string>(`video-feed-${Date.now()}`).current;
  
  // Track component mount state with better unmounting protection
  useEffect(() => {
    mountCounterRef.current++;
    unmountingRef.current = false;
    
    return () => {
      unmountingRef.current = true;
    };
  }, []);

  // Safe camera toggle with improved debouncing and state management
  const safeToggleCameraStream = useCallback(() => {
    if (!isMounted.current || unmountingRef.current || isUpdatingVideo || pendingOperationRef.current) return;
    
    // Set flags to prevent multiple toggles
    setIsUpdatingVideo(true);
    pendingOperationRef.current = true;
    
    // Add a small delay before the operation
    const safeOperation = createSafeHandler(async () => {
      try {
        // Call the actual toggle function
        await toggleCameraStream();
      } finally {
        // Use RAF to ensure we're in a stable rendering cycle
        requestAnimationFrame(() => {
          if (!isMounted.current) return;
          
          // Reset state after operation completes
          setIsUpdatingVideo(false);
          pendingOperationRef.current = false;
        });
      }
    }, 10);
    
    safeOperation();
  }, [toggleCameraStream, isUpdatingVideo, isMounted, createSafeHandler, setIsUpdatingVideo]);

  // Safe file upload with improved safety and error handling
  const safeHandleFileUpload = useCallback((file: File) => {
    if (!isMounted.current || unmountingRef.current || isUpdatingVideo || pendingOperationRef.current) return;
    
    // Set flags to prevent multiple uploads
    setIsUpdatingVideo(true);
    pendingOperationRef.current = true;
    
    const safeOperation = createSafeHandler(() => {
      try {
        // Handle the file upload
        handleFileUpload(file);
      } finally {
        // Reset state after operation completes
        requestAnimationFrame(() => {
          if (!isMounted.current) return;
          setIsUpdatingVideo(false);
          pendingOperationRef.current = false;
        });
      }
    }, 10);
    
    safeOperation();
  }, [handleFileUpload, isUpdatingVideo, isMounted, createSafeHandler, setIsUpdatingVideo]);

  // Handle visibility changes safely with improved cleanup
  useEffect(() => {
    if (!isMounted.current || unmountingRef.current) return;
    
    const handleVisibilityChange = () => {
      if (!isMounted.current || unmountingRef.current || pendingOperationRef.current) return;
      
      if (document.visibilityState === 'visible' && videoRef.current && !isCameraActive) {
        // Add a delay before attempting to play
        const visibilityHandler = createSafeHandler(() => {
          if (!videoRef.current) return;
          
          try {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error("Error playing video:", error);
              });
            }
          } catch (error) {
            console.error("Error trying to play video:", error);
          }
        }, 300);
        
        visibilityHandler();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [videoRef, isCameraActive, isMounted, createSafeHandler]);

  // Use more stable keys for components
  const mapModalKey = `map-api-modal-${uniqueId}-${showMapApiInput ? 'show' : 'hidden'}-${mountCounterRef.current}`;
  const controlsKey = `controls-${uniqueId}-${objectDetectionEnabled ? 'detection' : 'normal'}-${mountCounterRef.current}`;

  return (
    <div className={className || ''}>
      <VideoMainDisplay 
        videoRef={videoRef}
        canvasRef={canvasRef}
        videoSrc={videoSrc}
        isLoaded={isLoaded}
        error={error}
        objectDetectionEnabled={objectDetectionEnabled}
        isCameraActive={isCameraActive}
        onToggleCamera={safeToggleCameraStream}
        componentId={componentId}
      />
      
      {/* Map API key input modal - Only render when needed */}
      {showMapApiInput && (
        <MapApiKeyModal
          key={mapModalKey}
          mapApiKey={mapApiKey}
          setMapApiKey={setMapApiKey}
          onSave={handleSaveMapApiKey}
          onCancel={() => setShowMapApiInput(false)}
        />
      )}

      {/* Video controls with stable key */}
      <VideoControls
        key={controlsKey}
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
