
import React, { useEffect } from 'react';

interface VideoCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  objectDetectionEnabled: boolean;
}

const VideoCanvas: React.FC<VideoCanvasProps> = ({ 
  canvasRef,
  videoRef,
  objectDetectionEnabled
}) => {
  
  // Initialize canvas size when video dimensions are available
  useEffect(() => {
    const videoElement = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas || !videoElement || !videoElement.videoWidth) return;
    
    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth || videoElement.clientWidth;
    canvas.height = videoElement.videoHeight || videoElement.clientHeight;
  }, [canvasRef, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 w-full h-full object-cover ${objectDetectionEnabled ? 'opacity-100' : 'opacity-0'}`}
    />
  );
};

export default VideoCanvas;
