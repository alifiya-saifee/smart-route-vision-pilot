import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import DetectionService from '@/services/DetectionService';
import VoiceAlertService from '@/services/VoiceAlertService';
import { useToast } from '@/components/ui/use-toast';

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
  const emergencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetEmergencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const co2UpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const componentId = useRef<string>(`object-detection-${Date.now()}`).current;
  const [isRecording, setIsRecording] = useState(false);
  const [recordingData, setRecordingData] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  // Track component mount state - this needs to be the first effect
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      // First set the flag to prevent any further operations
      isMountedRef.current = false;
      
      // Explicitly cancel animations before clearing references
      if (requestIdRef.current) {
        try {
          cancelAnimationFrame(requestIdRef.current);
        } catch (e) {
          console.error("Error cancelling animation frame:", e);
        }
        requestIdRef.current = null;
      }
      
      if (processingTimerRef.current) {
        try {
          cancelAnimationFrame(processingTimerRef.current);
        } catch (e) {
          console.error("Error cancelling processing timer:", e);
        }
        processingTimerRef.current = null;
      }
      
      // Clear all timeouts and intervals on unmount
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
        emergencyTimeoutRef.current = null;
      }
      
      if (resetEmergencyTimeoutRef.current) {
        clearTimeout(resetEmergencyTimeoutRef.current);
        resetEmergencyTimeoutRef.current = null;
      }
      
      if (co2UpdateIntervalRef.current) {
        clearInterval(co2UpdateIntervalRef.current);
        co2UpdateIntervalRef.current = null;
      }
      
      // Clear video element reference
      videoElementRef.current = null;
    };
  }, []);

  // Handle object detection processing with optimized performance
  useEffect(() => {
    // Early return if detection disabled, component unmounted, or no canvas
    if (!objectDetectionEnabled || !canvasRef.current || !isMountedRef.current) {
      if (requestIdRef.current) {
        try {
          cancelAnimationFrame(requestIdRef.current);
        } catch (e) {
          console.error("Error cancelling animation frame:", e);
        }
        requestIdRef.current = null;
      }
      return;
    }
    
    let frameCount = 0;
    // Store video element reference but don't create a dependency
    if (!videoElementRef.current) {
      videoElementRef.current = document.querySelector('video');
    }
    
    if (!videoElementRef.current || !isMountedRef.current) {
      return;
    }
    
    const canvas = canvasRef.current;
    
    // Process video frames using requestAnimationFrame for better performance
    const processVideoFrame = () => {
      if (!isMountedRef.current) {
        // If component unmounted, cancel animation frame
        if (requestIdRef.current) {
          try {
            cancelAnimationFrame(requestIdRef.current);
          } catch (e) {
            console.error("Error cancelling animation frame:", e);
          }
          requestIdRef.current = null;
        }
        return;
      }
      
      frameCount++;
      
      // Use requestAnimationFrame for state updates to prevent batching issues
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        setDetectFrameCount(frameCount);
      });
      
      // Process frame if not already processing
      if (!processing && isMountedRef.current && videoElementRef.current) {
        setProcessing(true);
        
        // Use the DetectionService to process the current frame
        try {
          DetectionService.processVideo(videoElementRef.current, canvas, (results) => {
            if (!isMountedRef.current) return;
            handleDetectionResults(results);
            // Immediately reset processing flag for better performance
            setProcessing(false);
          });
        } catch (error) {
          console.error("Error processing video frame:", error);
          if (isMountedRef.current) {
            setProcessing(false);
          }
        }
      } else {
        // If we're still processing the previous frame, increment the skip counter
        frameSkipCount.current++;
        
        // If we've skipped too many frames, force reset the processing state
        // This prevents getting stuck in processing mode
        if (frameSkipCount.current > 10 && isMountedRef.current) {
          setProcessing(false);
          frameSkipCount.current = 0;
        }
      }
      
      // Only continue the animation loop if component is still mounted
      if (isMountedRef.current) {
        try {
          requestIdRef.current = requestAnimationFrame(processVideoFrame);
        } catch (e) {
          console.error("Error requesting animation frame:", e);
        }
      }
    };
    
    // Start processing frames only if component is mounted
    if (isMountedRef.current) {
      // Always cancel any existing animation frame before starting a new one
      if (requestIdRef.current) {
        try {
          cancelAnimationFrame(requestIdRef.current);
        } catch (e) {
          console.error("Error cancelling animation frame:", e);
        }
        requestIdRef.current = null;
      }
      
      try {
        requestIdRef.current = requestAnimationFrame(processVideoFrame);
      } catch (e) {
        console.error("Error requesting initial animation frame:", e);
      }
    }
    
    // Clean up when disabled or unmounted
    return () => {
      if (requestIdRef.current) {
        try {
          cancelAnimationFrame(requestIdRef.current);
        } catch (e) {
          console.error("Error cancelling animation frame in cleanup:", e);
        }
        requestIdRef.current = null;
      }
    };
  }, [objectDetectionEnabled, processing]);

  // Initialize the detection service when component mounts - using useCallback for stability
  const initializeDetection = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const status = await DetectionService.initialize();
      console.log("Detection services initialized:", status);
      
      // Initialize voice synthesis if available
      if ('speechSynthesis' in window) {
        // Pre-load voices
        window.speechSynthesis.getVoices();
        
        // Announce ready status (only when first initialized)
        if (isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current) {
              VoiceAlertService.speak("Detection system ready", "general", 1);
            }
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Failed to initialize detection:", err);
    }
  }, []);

  // Call initialization on mount
  useEffect(() => {
    if (isMountedRef.current) {
      initializeDetection();
    }
  }, [initializeDetection]);

  // Setup CO2 updating at regular intervals with proper cleanup
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Clear any existing interval first
    if (co2UpdateIntervalRef.current) {
      clearInterval(co2UpdateIntervalRef.current);
      co2UpdateIntervalRef.current = null;
    }
    
    if (objectDetectionEnabled) {
      // Fix: Cast the return value to NodeJS.Timeout
      const handler = () => {
        if (isMountedRef.current) {
          updateCO2Savings();
        }
      };
      
      co2UpdateIntervalRef.current = setInterval(handler, 2000) as unknown as NodeJS.Timeout;
    }

    return () => {
      if (co2UpdateIntervalRef.current) {
        clearInterval(co2UpdateIntervalRef.current);
        co2UpdateIntervalRef.current = null;
      }
    };
  }, [objectDetectionEnabled, updateCO2Savings]);

  // Function to trigger emergency mode manually with improved safety checks
  const triggerEmergencyMode = useCallback(() => {
    if (emergencyMode || !isMountedRef.current) return;
    
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
    if (!emergencyEventDispatched.current && isMountedRef.current) {
      emergencyEventDispatched.current = true;
      
      // Use setTimeout to ensure DOM is in a stable state before dispatching event
      setTimeout(() => {
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
        // Fix: Cast the return value to NodeJS.Timeout
        emergencyTimeoutRef.current = setTimeout(() => {
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
          // Fix: Cast the return value to NodeJS.Timeout
          resetEmergencyTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              emergencyEventDispatched.current = false;
            }
          }, 1000) as unknown as NodeJS.Timeout;
        }, 20000) as unknown as NodeJS.Timeout;
      }, 300);
    }
  }, [emergencyMode, updateEmergencyStatus]);

  // Start recording function
  const startRecording = useCallback(() => {
    if (isRecording || !videoElementRef.current || !isMountedRef.current) return;
    
    try {
      const stream = videoElementRef.current.captureStream();
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        if (!isMountedRef.current) return;
        
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Save the recorded video
        const a = document.createElement('a');
        a.href = url;
        a.download = `proximity-recording-${new Date().toISOString()}.webm`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        if (isMountedRef.current) {
          toast({
            title: "Recording saved",
            description: "Proximity recording has been saved"
          });
          
          console.log('✅ Proximity recording stopped and saved');
          setRecordingData([]);
        }
      };
      
      recorder.start(1000); // Collect data every second
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Proximity detection triggered recording"
      });
      
      console.log('⏺️ Proximity recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, [isRecording, toast]);

  // Stop recording function
  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current || !isMountedRef.current) return;
    
    try {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [isRecording]);

  // Handle detection results with improved performance
  const handleDetectionResults = useCallback((results: any) => {
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
    
    // Check for proximity to start/stop recording (10cm is too small, using 5m for demo)
    const proximityThresholdInMeters = 5;
    const nearbyVehicles = filteredObjects.filter((obj: any) => 
      ['car', 'truck', 'bus'].includes(obj.type.toLowerCase()) && 
      obj.distance && 
      obj.distance <= proximityThresholdInMeters
    );
    
    // Start recording if close to vehicle and not already recording
    if (nearbyVehicles.length > 0 && !isRecording) {
      startRecording();
    } 
    // Stop recording if no longer close to any vehicle
    else if (nearbyVehicles.length === 0 && isRecording) {
      // Add a small delay to avoid stopping/starting repeatedly
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        // Check again to make sure we're still not close
        const currentResults = detectionResultsRef.current;
        if (!currentResults) return;
        
        const stillNearby = currentResults.objects.some((obj: any) => 
          ['car', 'truck', 'bus'].includes(obj.type.toLowerCase()) && 
          obj.distance && 
          obj.distance <= proximityThresholdInMeters
        );
        
        if (!stillNearby) {
          stopRecording();
        }
      }, 3000);
    }
    
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
    
    // Throttle UI updates for better performance
    if (now - lastDetectionTime.current > 50 && isMountedRef.current) { // More frequent updates for real-time
      lastDetectionTime.current = now;
      
      // Use requestAnimationFrame for updates to ensure they happen in a rendering cycle
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        
        if (filteredObjects && Array.isArray(filteredObjects)) {
          // Update detected objects in navigation context
          updateDetectedObjects(filteredObjects);
        }
        
        if (results.lanes) {
          // Update lane offset in navigation context
          updateLaneOffset(results.lanes);
        }
      });
    }
  }, [confidenceThreshold, emergencyMode, updateDetectedObjects, updateLaneOffset, isRecording, startRecording, stopRecording]);

  const toggleObjectDetection = useCallback(() => {
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
  }, [objectDetectionEnabled, emergencyMode, updateCO2Savings, updateEmergencyStatus]);

  return {
    canvasRef,
    objectDetectionEnabled,
    detectFrameCount,
    processing,
    emergencyMode,
    confidenceThreshold,
    setConfidenceThreshold,
    toggleObjectDetection,
    triggerEmergencyMode,
    isRecording
  };
};
