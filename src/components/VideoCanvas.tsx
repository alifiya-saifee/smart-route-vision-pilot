
import React, { useEffect, useRef } from 'react';

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
  // FPS counter for performance monitoring
  const fpsRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(Date.now());
  const fpsDisplayRef = useRef<HTMLDivElement>(null);
  
  // Initialize canvas size when video dimensions are available
  useEffect(() => {
    const videoElement = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas || !videoElement || !videoElement.videoWidth) return;
    
    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth || videoElement.clientWidth;
    canvas.height = videoElement.videoHeight || videoElement.clientHeight;
  }, [canvasRef, videoRef]);
  
  // Set up FPS counter
  useEffect(() => {
    if (!objectDetectionEnabled) return;
    
    const calculateFps = () => {
      frameCountRef.current++;
      const now = Date.now();
      
      // Update FPS counter every 500ms
      if (now - lastFpsUpdateRef.current > 500) {
        // Calculate FPS
        const elapsed = (now - lastFpsUpdateRef.current) / 1000;
        fpsRef.current = Math.round(frameCountRef.current / elapsed);
        
        // Update display if available
        if (fpsDisplayRef.current) {
          fpsDisplayRef.current.textContent = `${fpsRef.current} FPS`;
        }
        
        // Reset counters
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
      
      // Request next frame
      requestAnimationFrame(calculateFps);
    };
    
    // Start FPS calculation
    const animationId = requestAnimationFrame(calculateFps);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [objectDetectionEnabled]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full object-cover ${
          objectDetectionEnabled ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* FPS counter overlay */}
      {objectDetectionEnabled && (
        <div
          ref={fpsDisplayRef}
          className="absolute top-4 left-4 bg-black/70 text-green-400 px-2 py-1 text-xs rounded font-mono"
        >
          -- FPS
        </div>
      )}
    </>
  );
};

export default VideoCanvas;
