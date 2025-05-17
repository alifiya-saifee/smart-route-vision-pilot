
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
  const mapApiKeyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const mountCounterRef = useRef<number>(0);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

  // Generate stable component keys
  const componentId = useRef<string>(`video-feed-${Date.now()}`).current;
  
  // Helper to register cleanup functions
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.push(cleanupFn);
  }, []);

  // Handle saving the map API key with debounce
  const handleSaveMapApiKey = useCallback(() => {
    if (!isMountedRef.current || unmountingRef.current) return;
    
    // Clear any existing timeouts first
    if (mapApiKeyTimeoutRef.current) {
      clearTimeout(mapApiKeyTimeoutRef.current);
      mapApiKeyTimeoutRef.current = null;
    }
    
    // Save after a short delay to prevent multiple saves
    mapApiKeyTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current || unmountingRef.current) return;
      
      localStorage.setItem('mapApiKey', mapApiKey);
      setShowMapApiInput(false);
      toast({
        title: "API key saved",
        description: "Map API key has been saved successfully"
      });
    }, 300) as unknown as NodeJS.Timeout;
    
    // Register cleanup for this timeout
    registerCleanup(() => {
      if (mapApiKeyTimeoutRef.current) {
        clearTimeout(mapApiKeyTimeoutRef.current);
        mapApiKeyTimeoutRef.current = null;
      }
    });
  }, [mapApiKey, toast, registerCleanup]);

  // Track component mount state with better unmounting protection
  useEffect(() => {
    isMountedRef.current = true;
    unmountingRef.current = false;
    mountCounterRef.current++;
    
    return () => {
      // First, signal that component is unmounting to prevent any new operations
      unmountingRef.current = true;
      
      // Execute all registered cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (err) {
          console.error("Cleanup error:", err);
        }
      });
      
      // Clean up any pending timeouts
      if (safeOperationTimeoutRef.current) {
        clearTimeout(safeOperationTimeoutRef.current);
        safeOperationTimeoutRef.current = null;
      }
      
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
      
      if (mapApiKeyTimeoutRef.current) {
        clearTimeout(mapApiKeyTimeoutRef.current);
        mapApiKeyTimeoutRef.current = null;
      }
      
      // Clear the cleanup functions array
      cleanupFunctionsRef.current = [];
      
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
    
    // Add a small delay before the operation to ensure any pending React updates are processed
    safeOperationTimeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current || unmountingRef.current) return;
      
      try {
        // Call the actual toggle function
        await toggleCameraStream();
      } catch (error) {
        console.error("Error in camera toggle:", error);
      } finally {
        // Use RAF to ensure we're in a stable rendering cycle
        requestAnimationFrame(() => {
          if (!isMountedRef.current || unmountingRef.current) return;
          
          // Reset state after operation completes
          setIsUpdatingVideo(false);
          pendingOperationRef.current = false;
        });
      }
    }, 10) as unknown as NodeJS.Timeout;
    
    // Register cleanup for this timeout
    registerCleanup(() => {
      if (safeOperationTimeoutRef.current) {
        clearTimeout(safeOperationTimeoutRef.current);
        safeOperationTimeoutRef.current = null;
      }
    });
  }, [toggleCameraStream, isUpdatingVideo, registerCleanup]);

  // Safe file upload with improved safety and error handling
  const safeHandleFileUpload = useCallback((file: File) => {
    if (!isMountedRef.current || unmountingRef.current || isUpdatingVideo || pendingOperationRef.current) return;
    
    // Set flags to prevent multiple uploads
    setIsUpdatingVideo(true);
    pendingOperationRef.current = true;
    
    safeOperationTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current || unmountingRef.current) return;
      
      try {
        // Handle the file upload
        handleFileUpload(file);
      } catch (error) {
        console.error("Error handling file upload:", error);
      } finally {
        // Use RAF to ensure we're in a stable rendering cycle
        requestAnimationFrame(() => {
          if (!isMountedRef.current || unmountingRef.current) return;
          
          // Reset state after operation completes
          setIsUpdatingVideo(false);
          pendingOperationRef.current = false;
        });
      }
    }, 10) as unknown as NodeJS.Timeout;
    
    // Register cleanup for this timeout
    registerCleanup(() => {
      if (safeOperationTimeoutRef.current) {
        clearTimeout(safeOperationTimeoutRef.current);
        safeOperationTimeoutRef.current = null;
      }
    });
  }, [handleFileUpload, isUpdatingVideo, registerCleanup]);

  // Handle visibility changes safely with improved cleanup
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
          
          visibilityTimeoutRef.current = null;
        }, 300) as unknown as NodeJS.Timeout;
        
        // Register cleanup for this timeout
        registerCleanup(() => {
          if (visibilityTimeoutRef.current) {
            clearTimeout(visibilityTimeoutRef.current);
            visibilityTimeoutRef.current = null;
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Register cleanup for event listeners
    registerCleanup(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
    };
  }, [videoRef, isCameraActive, registerCleanup]);

  // Use more stable keys for components
  const videoKey = `video-${uniqueId}-${isCameraActive ? 'camera' : 'file'}-${mountCounterRef.current}`;
  const canvasKey = `canvas-${uniqueId}-${objectDetectionEnabled ? 'detection' : 'normal'}-${mountCounterRef.current}`;
  const controlsKey = `controls-${uniqueId}-${objectDetectionEnabled ? 'detection' : 'normal'}-${mountCounterRef.current}`;
  const mapModalKey = `map-api-modal-${uniqueId}-${showMapApiInput ? 'show' : 'hidden'}-${mountCounterRef.current}`;
  const errorKey = `error-${uniqueId}-${error ? 'true' : 'false'}-${mountCounterRef.current}`;
  const loadingKey = `loading-${uniqueId}-${mountCounterRef.current}`;

  return (
    <div 
      ref={videoContainerRef}
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${className || ''}`}
      key={`video-feed-container-${componentId}`}
    >
      {/* Video element with stable key */}
      {videoRef && (
        <video
          ref={videoRef}
          key={videoKey}
          src={!isCameraActive ? videoSrc : undefined}
          loop={!isCameraActive}
          muted
          playsInline
          autoPlay={!isCameraActive}
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          data-testid="video-element"
        />
      )}
      
      {/* Canvas overlay with stable key */}
      {videoRef && canvasRef && isLoaded && (
        <VideoCanvas 
          key={canvasKey}
          canvasRef={canvasRef}
          videoRef={videoRef} 
          objectDetectionEnabled={objectDetectionEnabled}
          onToggleCamera={safeToggleCameraStream}
          isCameraActive={isCameraActive}
        />
      )}
      
      {/* Loading/error states */}
      {!isLoaded && (
        <div
          key={error ? errorKey : loadingKey}
          className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-white"
          data-testid={error ? "error-state" : "loading-state"}
        >
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
