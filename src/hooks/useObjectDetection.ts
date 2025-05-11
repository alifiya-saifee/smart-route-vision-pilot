
import { useState, useRef, useEffect } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import DetectionService from '@/services/DetectionService';
import VoiceAlertService from '@/services/VoiceAlertService';

export const useObjectDetection = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [objectDetectionEnabled, setObjectDetectionEnabled] = useState(false);
  const [detectFrameCount, setDetectFrameCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const processingTimerRef = useRef<number | null>(null);
  const lastDetectionTime = useRef<number>(Date.now());
  const detectionResultsRef = useRef<any>({ objects: [], lanes: { offset: 0, direction: 'Center' } });
  const { updateDetectedObjects, updateLaneOffset, updateCO2Savings } = useNavigation();
  const highPriorityDetectionRef = useRef<boolean>(false);
  const requestIdRef = useRef<number | null>(null);

  // Handle object detection processing with optimized performance
  useEffect(() => {
    if (!objectDetectionEnabled || !canvasRef.current) {
      // If detection is disabled, clear any existing processing
      if (processingTimerRef.current) {
        cancelAnimationFrame(processingTimerRef.current);
        processingTimerRef.current = null;
      }
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
      }
      return;
    }
    
    let frameCount = 0;
    const videoElement = document.querySelector('video');
    
    if (!videoElement) {
      return;
    }
    
    const canvas = canvasRef.current;
    
    // Process video frames using requestAnimationFrame for better performance
    const processVideoFrame = () => {
      frameCount++;
      setDetectFrameCount(frameCount);
      
      // Process every frame when critical objects are detected, otherwise process every 2nd frame
      if ((frameCount % (highPriorityDetectionRef.current ? 1 : 2) === 0) && !processing) {
        setProcessing(true);
        
        // Use the DetectionService to process the current frame
        try {
          DetectionService.processVideo(videoElement, canvas, handleDetectionResults);
        } catch (error) {
          console.error("Error processing video frame:", error);
        }
      }
      
      // Continue the animation loop
      requestIdRef.current = requestAnimationFrame(processVideoFrame);
    };
    
    // Start processing frames
    requestIdRef.current = requestAnimationFrame(processVideoFrame);
    
    // Clean up when disabled or unmounted
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
      }
    };
  }, [objectDetectionEnabled, processing]);

  // Initialize the detection service when component mounts
  useEffect(() => {
    const initializeDetection = async () => {
      try {
        const status = await DetectionService.initialize();
        console.log("Detection services initialized:", status);
        
        // Initialize voice synthesis if available
        if ('speechSynthesis' in window) {
          // Pre-load voices
          window.speechSynthesis.getVoices();
          
          // Announce ready status (only when first initialized)
          setTimeout(() => {
            VoiceAlertService.speak("Detection system ready", "general", 1);
          }, 1000);
        }
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
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
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

  // Handle detection results with improved performance
  const handleDetectionResults = (results: any) => {
    const now = Date.now();
    // Save the latest detection results
    detectionResultsRef.current = results;
    
    // Check for high priority objects (pedestrians, traffic signs)
    highPriorityDetectionRef.current = results.objects.some((obj: any) => 
      ['person', 'pedestrian', 'traffic light', 'stop sign'].includes(obj.type.toLowerCase())
    );
    
    // Throttle updates to avoid overwhelming the UI
    if (now - lastDetectionTime.current > 80) { // More frequent updates for real-time
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
    
    // Reset processing flag immediately for better performance
    setProcessing(false);
  };

  const toggleObjectDetection = () => {
    const newState = !objectDetectionEnabled;
    setObjectDetectionEnabled(newState);
    
    // Force CO2 update when detection is toggled on
    if (newState) {
      updateCO2Savings();
      
      // Announce activation
      VoiceAlertService.speak("Detection activated", "general", 1);
    } else {
      // Announce deactivation
      VoiceAlertService.speak("Detection deactivated", "general", 1);
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
