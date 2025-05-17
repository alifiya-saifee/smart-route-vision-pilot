
import React, { useRef } from 'react';
import VideoCanvas from '@/components/VideoCanvas';

interface VideoMainDisplayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoSrc: string;
  isLoaded: boolean;
  error: string | null;
  objectDetectionEnabled: boolean;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  componentId: string;
}

const VideoMainDisplay: React.FC<VideoMainDisplayProps> = ({
  videoRef,
  canvasRef,
  videoSrc,
  isLoaded,
  error,
  objectDetectionEnabled,
  isCameraActive,
  onToggleCamera,
  componentId
}) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // Generate stable keys for components
  const videoKey = `video-${componentId}-${isCameraActive ? 'camera' : 'file'}`;
  const canvasKey = `canvas-${componentId}-${objectDetectionEnabled ? 'detection' : 'normal'}`;
  const errorKey = `error-${componentId}-${error ? 'true' : 'false'}`;
  const loadingKey = `loading-${componentId}`;

  return (
    <div 
      ref={videoContainerRef}
      className="relative bg-gray-900 rounded-lg overflow-hidden w-full h-full"
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
          onToggleCamera={onToggleCamera}
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
    </div>
  );
};

export default VideoMainDisplay;
