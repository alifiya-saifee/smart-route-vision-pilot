import React, { useEffect, useState } from 'react';
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
    toggleObjectDetection
  } = useObjectDetection();
  
  const [mapApiKey, setMapApiKey] = useState<string>(() => {
    return localStorage.getItem('mapApiKey') || '';
  });
  
  const [showMapApiInput, setShowMapApiInput] = useState<boolean>(!localStorage.getItem('mapApiKey'));
  const { toast } = useToast();

  const handleSaveMapApiKey = () => {
    localStorage.setItem('mapApiKey', mapApiKey);
    setShowMapApiInput(false);
    toast({
      title: "API key saved",
      description: "Map API key has been saved successfully"
    });
  };

  // Ensure video keeps playing when tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && videoRef.current && !isCameraActive) {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
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
      />
      
      {/* Canvas overlay for object detection */}
      <VideoCanvas 
        canvasRef={canvasRef}
        videoRef={videoRef} 
        objectDetectionEnabled={objectDetectionEnabled}
        onToggleCamera={toggleCameraStream}
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
        onFileUpload={handleFileUpload}
        objectDetectionEnabled={objectDetectionEnabled}
        toggleObjectDetection={toggleObjectDetection}
        processing={processing}
        detectFrameCount={detectFrameCount}
        isLoaded={isLoaded}
        toggleCameraStream={toggleCameraStream}
        isCameraActive={isCameraActive}
      />
    </div>
  );
};

export default VideoFeed;
