
import { useState, useRef, useEffect } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import DetectionService from '@/services/DetectionService';
import VoiceAlertService from '@/services/VoiceAlertService';

export const useObjectDetection = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [objectDetectionEnabled, setObjectDetectionEnabled] = useState(false);
  const [detectFrameCount, setDetectFrameCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const processingTimerRef = useRef<number | null>(null);
  const lastDetectionTime = useRef<number>(Date.now());
  const detectionResultsRef = useRef<any>({ 
    objects: [], 
    lanes: { offset: 0, direction: 'Center' },
    pois: []
  });
  const { updateDetectedObjects, updateLaneOffset, updateCO2Savings, updateEmergencyStatus } = useNavigation();
  const highPriorityDetectionRef = useRef<boolean>(false);
  const requestIdRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

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
    
    // Set up emergency detection event listener
    window.addEventListener('emergency-detected', ((e: CustomEvent) => {
      console.log('Emergency detected event received', e.detail);
      setEmergencyMode(true);
      startRecording();
      
      // Update emergency status through navigation context
      updateEmergencyStatus({
        active: true,
        level: "critical",
        type: "collision_risk",
        triggers: [{
          type: "proximity",
          level: "critical",
          details: "Vehicle too close"
        }],
        duration: 0,
        response: "Recording started, scanning for nearby medical facilities"
      });
    }) as EventListener);
    
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
      
      window.removeEventListener('emergency-detected', (() => {}) as EventListener);
      
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [updateEmergencyStatus]);

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

  // Start recording function for emergency mode
  const startRecording = async () => {
    try {
      const videoElement = document.querySelector('video');
      if (!videoElement || !(videoElement instanceof HTMLVideoElement)) {
        throw new Error('Video element not found');
      }
      
      // In a real implementation, this would use MediaRecorder API
      // to record video and save it for emergency purposes
      console.log('⚠️ Emergency recording started');
      
      // Simulate recording functionality
      setTimeout(() => {
        // End emergency mode after some time (simulated)
        setEmergencyMode(false);
        console.log('✅ Emergency recording stopped and saved');
        
        // Update emergency status
        updateEmergencyStatus({
          active: false,
          level: "none",
          type: null,
          triggers: [],
          duration: 0
        });
        
        // Show notification
        VoiceAlertService.speak("Emergency recording saved", "general", 2);
      }, 10000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Handle detection results with improved performance
  const handleDetectionResults = (results: any) => {
    const now = Date.now();
    // Save the latest detection results
    detectionResultsRef.current = results;
    
    // Update emergency mode status
    if (results.emergency !== emergencyMode) {
      setEmergencyMode(results.emergency);
    }
    
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
      
      // Stop any emergency mode when detection is turned off
      if (emergencyMode) {
        setEmergencyMode(false);
        updateEmergencyStatus({
          active: false,
          level: "none",
          type: null,
          triggers: [],
          duration: 0
        });
      }
    }
  };

  return {
    canvasRef,
    objectDetectionEnabled,
    detectFrameCount,
    processing,
    emergencyMode,
    toggleObjectDetection
  };
};
