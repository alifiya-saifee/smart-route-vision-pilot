
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
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5); // Default 50% threshold
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
  const emergencyEventDispatched = useRef<boolean>(false);
  const frameSkipCount = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

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
      if (!isMountedRef.current) return;
      
      frameCount++;
      setDetectFrameCount(frameCount);
      
      // Optimize frame processing by skipping frames when needed
      // Process every frame regardless of priority for smoother real-time experience
      if (!processing) {
        setProcessing(true);
        
        // Use the DetectionService to process the current frame
        try {
          DetectionService.processVideo(videoElement, canvas, (results) => {
            if (!isMountedRef.current) return;
            handleDetectionResults(results);
            // Immediately reset processing flag for better performance
            setProcessing(false);
          });
        } catch (error) {
          console.error("Error processing video frame:", error);
          setProcessing(false);
        }
      } else {
        // If we're still processing the previous frame, increment the skip counter
        frameSkipCount.current++;
        
        // If we've skipped too many frames, force reset the processing state
        // This prevents getting stuck in processing mode
        if (frameSkipCount.current > 10) {
          setProcessing(false);
          frameSkipCount.current = 0;
        }
      }
      
      // Continue the animation loop
      if (isMountedRef.current) {
        requestIdRef.current = requestAnimationFrame(processVideoFrame);
      }
    };
    
    // Start processing frames
    if (isMountedRef.current) {
      requestIdRef.current = requestAnimationFrame(processVideoFrame);
    }
    
    // Clean up when disabled or unmounted
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
      }
    };
  }, [objectDetectionEnabled]);

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      isMountedRef.current = false;
      
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
      if (objectDetectionEnabled && isMountedRef.current) {
        updateCO2Savings();
      }
    }, 2000); // Update CO2 every 2 seconds when detection is active

    return () => {
      // Clean up
      clearInterval(co2UpdateInterval);
    };
  }, [objectDetectionEnabled, updateCO2Savings]);

  // Function to trigger emergency mode manually
  const triggerEmergencyMode = () => {
    if (emergencyMode || !isMountedRef.current) return; // Don't trigger if already in emergency mode or unmounted
    
    setEmergencyMode(true);
    
    // Update emergency status through navigation context
    updateEmergencyStatus({
      active: true,
      level: "critical",
      type: "manual_emergency",
      triggers: [{
        type: "user_initiated",
        level: "critical",
        details: "Emergency services requested"
      }],
      duration: 0,
      response: "Locating nearest hospital and emergency services"
    });
    
    // Only dispatch the event once to avoid React reconciliation issues
    if (!emergencyEventDispatched.current) {
      emergencyEventDispatched.current = true;
      
      // Use requestAnimationFrame to ensure DOM is in a stable state
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        
        try {
          // Create and dispatch custom event for other components to react to
          const emergencyEvent = new CustomEvent('emergency-detected', {
            detail: { type: 'manual', time: new Date() }
          });
          window.dispatchEvent(emergencyEvent);
        } catch (error) {
          console.error("Error dispatching emergency event:", error);
        }
        
        // Announce emergency mode
        VoiceAlertService.speak("Emergency mode activated. Locating nearest hospital.", "emergency", 1);
        
        // End emergency mode after some time with safety checks
        const emergencyTimeout = setTimeout(() => {
          if (!isMountedRef.current) return;
          
          setEmergencyMode(false);
          updateEmergencyStatus({
            active: false,
            level: "none",
            type: null,
            triggers: [],
            duration: 0
          });
          
          console.log('✅ Emergency recording stopped and saved');
          VoiceAlertService.speak("Emergency response complete. Nearest hospital: Memorial Hospital, 1.2 miles ahead.", "general", 1);
          
          // Reset flag after emergency is complete
          const resetTimeout = setTimeout(() => {
            if (isMountedRef.current) {
              emergencyEventDispatched.current = false;
            }
          }, 1000);
          
          return () => clearTimeout(resetTimeout);
        }, 20000);
        
        return () => clearTimeout(emergencyTimeout);
      });
    }
  };

  // Handle detection results with improved performance
  const handleDetectionResults = (results: any) => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    // Save the latest detection results
    detectionResultsRef.current = results;
    
    // Apply confidence threshold filtering
    const filteredObjects = results.objects.filter((obj: any) => 
      obj.confidence >= confidenceThreshold
    );
    
    // Check for high priority objects (pedestrians, traffic signs)
    highPriorityDetectionRef.current = filteredObjects.some((obj: any) => 
      ['person', 'pedestrian', 'traffic light', 'stop sign'].includes(obj.type.toLowerCase())
    );
    
    // In emergency mode, add nearby hospitals to the detection results
    if (emergencyMode) {
      // Simulate finding nearby hospitals
      const nearbyHospitals = [
        { 
          type: 'hospital',
          name: 'Memorial Hospital',
          distance: '1.2 miles',
          direction: 'ahead',
          coordinates: { lat: 40.7128, lng: -74.006 }
        },
        {
          type: 'hospital',
          name: 'City Medical Center',
          distance: '2.8 miles',
          direction: 'right',
          coordinates: { lat: 40.7138, lng: -74.016 }
        }
      ];
      
      results.pois = nearbyHospitals;
    }
    
    // Update immediately for better performance, just throttle UI updates
    // Don't block detection processing with UI updates
    if (now - lastDetectionTime.current > 50) { // More frequent updates for real-time
      lastDetectionTime.current = now;
      
      if (isMountedRef.current) {
        if (filteredObjects && Array.isArray(filteredObjects)) {
          // Update detected objects in navigation context
          updateDetectedObjects(filteredObjects);
        }
        
        if (results.lanes) {
          // Update lane offset in navigation context
          updateLaneOffset(results.lanes);
        }
      }
    }
  };

  const toggleObjectDetection = () => {
    if (!isMountedRef.current) return;
    
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
    confidenceThreshold,
    setConfidenceThreshold,
    toggleObjectDetection,
    triggerEmergencyMode
  };
};
