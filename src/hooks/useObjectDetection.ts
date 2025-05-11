
import { useState, useRef, useEffect } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import DetectionService from '@/services/DetectionService';

export const useObjectDetection = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [objectDetectionEnabled, setObjectDetectionEnabled] = useState(false);
  const [detectFrameCount, setDetectFrameCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const processingTimerRef = useRef<number | null>(null);
  const lastDetectionTime = useRef<number>(Date.now());
  const detectionResultsRef = useRef<any>({ objects: [], lanes: { offset: 0, direction: 'Center' } });
  const { updateDetectedObjects, updateLaneOffset, updateCO2Savings } = useNavigation();

  // Handle object detection processing
  useEffect(() => {
    if (!objectDetectionEnabled || !canvasRef.current) {
      // If detection is disabled, clear any existing processing
      if (processingTimerRef.current) {
        cancelAnimationFrame(processingTimerRef.current);
        processingTimerRef.current = null;
      }
      return;
    }
    
    let frameCount = 0;
    const videoElement = document.querySelector('video');
    
    if (!videoElement) {
      return;
    }
    
    const canvas = canvasRef.current;
    
    // Process video frames
    const processVideoFrame = () => {
      frameCount++;
      setDetectFrameCount(frameCount);
      
      // Only process every few frames to reduce load
      if (frameCount % 3 === 0 && !processing) {
        setProcessing(true);
        
        // Use the DetectionService to process the current frame
        try {
          DetectionService.processVideo(videoElement, canvas, handleDetectionResults);
        } catch (error) {
          console.error("Error processing video frame:", error);
        }
      }
      
      // Continue the animation loop
      processingTimerRef.current = requestAnimationFrame(processVideoFrame);
    };
    
    // Start processing frames
    processingTimerRef.current = requestAnimationFrame(processVideoFrame);
    
    // Clean up when disabled or unmounted
    return () => {
      if (processingTimerRef.current) {
        cancelAnimationFrame(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    };
  }, [objectDetectionEnabled, processing]);

  // Initialize the detection service when component mounts
  useEffect(() => {
    const initializeDetection = async () => {
      try {
        const status = await DetectionService.initialize();
        console.log("Detection services initialized:", status);
      } catch (err) {
        console.error("Failed to initialize detection:", err);
      }
    };
    
    initializeDetection();
    
    // Clean up function
    return () => {
      if (processingTimerRef.current) {
        cancelAnimationFrame(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    };
  }, []);

  // Setup CO2 updating at regular intervals
  useEffect(() => {
    const co2UpdateInterval = window.setInterval(() => {
      if (objectDetectionEnabled) {
        updateCO2Savings();
      }
    }, 2000); // Update CO2 every 2 seconds when detection is active

    return () => {
      // Clean up
      clearInterval(co2UpdateInterval);
    };
  }, [objectDetectionEnabled, updateCO2Savings]);

  // Handle detection results
  const handleDetectionResults = (results: any) => {
    const now = Date.now();
    // Save the latest detection results
    detectionResultsRef.current = results;
    
    // Throttle updates to avoid overwhelming the UI
    if (now - lastDetectionTime.current > 100) {
      lastDetectionTime.current = now;
      
      if (results.objects && Array.isArray(results.objects)) {
        // Update detected objects in navigation context
        updateDetectedObjects(results.objects);
      }
      
      if (results.lanes) {
        // Update lane offset in navigation context
        updateLaneOffset(results.lanes);
      }
    }
    
    // Reset processing flag after a short delay
    setTimeout(() => setProcessing(false), 50);
  };

  const toggleObjectDetection = () => {
    setObjectDetectionEnabled(!objectDetectionEnabled);
    
    // Force CO2 update when detection is toggled on
    if (!objectDetectionEnabled) {
      updateCO2Savings();
    }
  };

  return {
    canvasRef,
    objectDetectionEnabled,
    detectFrameCount,
    processing,
    toggleObjectDetection
  };
};
