
// This service handles the integration between the React frontend and detection models
// It simulates the bridge between our React app and models for object and lane detection

class DetectionService {
  private trafficModelLoaded: boolean;
  private yoloModelLoaded: boolean;
  private laneProcessorReady: boolean;
  private videoStream: MediaStream | null;
  private processingInterval: number | null;
  private trafficSignModel: any; // Would be TensorFlow.js model in real implementation
  private yoloModel: any; // Would be TensorFlow.js model in real implementation
  private lastProcessedTime: number;
  private frameCount: number;

  constructor() {
    this.trafficModelLoaded = false;
    this.yoloModelLoaded = false;
    this.laneProcessorReady = false;
    this.videoStream = null;
    this.processingInterval = null;
    this.trafficSignModel = null;
    this.yoloModel = null;
    this.lastProcessedTime = 0;
    this.frameCount = 0;
  }
  
  /**
   * Initialize all detection models and processors
   */
  async initialize() {
    try {
      await Promise.all([
        this.loadTrafficSignModel(),
        this.loadYoloModel(),
        this.initializeLaneProcessor()
      ]);
      
      return {
        trafficModelLoaded: this.trafficModelLoaded,
        yoloModelLoaded: this.yoloModelLoaded,
        laneProcessorReady: this.laneProcessorReady
      };
    } catch (error) {
      console.error("Initialization error:", error);
      throw new Error("Failed to initialize detection systems");
    }
  }
  
  /**
   * Load the traffic sign classifier model
   */
  async loadTrafficSignModel() {
    try {
      // In a real implementation, this would use TensorFlow.js to load the model
      console.log("Loading traffic sign classifier from traffic_sign_classifier.h5");
      
      // Simulating model loading time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In reality, you would load the model and label encoder like this:
      // this.trafficSignModel = await tf.loadLayersModel('traffic_sign_classifier.h5');
      // this.labelEncoder = await fetch('label_encoder.pkl').then(res => res.json());
      
      this.trafficModelLoaded = true;
      console.log("Traffic sign classifier loaded successfully");
      return true;
    } catch (error) {
      console.error("Failed to load traffic sign classifier:", error);
      this.trafficModelLoaded = false;
      return false;
    }
  }
  
  /**
   * Load the YOLO object detection model as fallback
   */
  async loadYoloModel() {
    try {
      // In a real implementation, this would use TensorFlow.js to load the YOLO model
      console.log("Loading YOLO object detection model");
      
      // Simulating model loading time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In reality, you would load the model like this:
      // this.yoloModel = await tf.loadGraphModel('yolo_model/model.json');
      
      this.yoloModelLoaded = true;
      console.log("YOLO model loaded successfully");
      return true;
    } catch (error) {
      console.error("Failed to load YOLO model:", error);
      this.yoloModelLoaded = false;
      return false;
    }
  }
  
  /**
   * Initialize the lane detection processor
   */
  async initializeLaneProcessor() {
    try {
      console.log("Initializing lane processor");
      
      // In a real implementation, this might load parameters or calibration data
      // Or initialize web workers for lane processing
      
      // Simulating initialization time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.laneProcessorReady = true;
      console.log("Lane processor initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize lane processor:", error);
      this.laneProcessorReady = false;
      return false;
    }
  }
  
  /**
   * Start capturing and processing video frames
   * @param videoElement - The video element to capture frames from
   * @param onDetection - Callback function to receive detection results
   * @param canvas - Canvas element for drawing detection results
   */
  async startDetection(videoElement: HTMLVideoElement, onDetection: Function, canvas?: HTMLCanvasElement) {
    if (!videoElement) {
      throw new Error("Video element is required");
    }
    
    // Stop any existing processing
    this.stopDetection();
    
    try {
      // Instead of using setInterval, we'll use requestAnimationFrame for smoother processing
      const processFrame = async () => {
        this.frameCount++;
        
        // Only process every 10th frame to reduce CPU load
        if (this.frameCount % 10 === 0) {
          // Process the current video frame
          if (canvas && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
            const context = canvas.getContext('2d');
            if (context) {
              // Draw the current frame to the canvas for processing
              context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
              
              // Extract image data (in a real implementation this would be used for ML processing)
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              
              // Process the frame with our detection models
              await this.processFrame(imageData, onDetection);
            }
          } else {
            // If no canvas provided or video not ready, use null imageData for simulation
            await this.processFrame(null, onDetection);
          }
        }
        
        // Continue the detection loop if interval is still active
        if (this.processingInterval) {
          this.processingInterval = requestAnimationFrame(processFrame);
        }
      };
      
      // Start the detection loop
      this.processingInterval = requestAnimationFrame(processFrame);
      
      return true;
    } catch (error) {
      console.error("Failed to start video processing:", error);
      throw new Error("Could not process video");
    }
  }
  
  /**
   * Stop all detection processing
   */
  stopDetection() {
    if (this.processingInterval) {
      cancelAnimationFrame(this.processingInterval);
      this.processingInterval = null;
    }
    
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }
  
  /**
   * Process a single video frame
   * @param imageData - The image data to process (null in our simulation)
   * @param onDetection - Callback for detection results
   */
  async processFrame(imageData: ImageData | null, onDetection: Function) {
    try {
      // Only process frames at most every 100ms to avoid overwhelming the UI
      const now = Date.now();
      if (now - this.lastProcessedTime < 100) {
        return;
      }
      this.lastProcessedTime = now;
      
      // First try to use traffic sign classifier
      let detectionResults = null;
      
      if (this.trafficModelLoaded) {
        // Attempt to detect traffic signs first
        detectionResults = await this.detectTrafficSigns(imageData);
        
        // If no traffic signs found and YOLO is available, use YOLO as fallback
        if ((!detectionResults || detectionResults.objects.length === 0) && this.yoloModelLoaded) {
          detectionResults = await this.detectObjectsWithYolo(imageData);
        }
      } else if (this.yoloModelLoaded) {
        // If traffic sign model not loaded but YOLO is, use YOLO
        detectionResults = await this.detectObjectsWithYolo(imageData);
      }
      
      // Detect lanes
      const laneResults = this.laneProcessorReady ? 
        await this.detectLanes(imageData) : { offset: 0, direction: "Unknown" };
      
      // Call the callback with results
      if (onDetection && typeof onDetection === 'function') {
        onDetection({
          objects: detectionResults ? detectionResults.objects : [],
          lanes: laneResults,
          modelUsed: detectionResults ? detectionResults.modelUsed : 'none',
          timestamp: Date.now() // Add timestamp for synchronization
        });
      }
    } catch (error) {
      console.error("Error processing frame:", error);
    }
  }
  
  /**
   * Detect traffic signs in an image
   * @param imageData - The image data to process
   * @returns Detection results
   */
  async detectTrafficSigns(imageData: ImageData | null) {
    // In a real implementation, this would preprocess the image and run inference
    // For simulation, we'll return some dummy traffic sign data
    
    // Randomly decide whether to detect a sign or not
    const detectSign = Math.random() > 0.5;
    
    if (!detectSign) {
      return { objects: [], modelUsed: 'traffic_sign' };
    }
    
    // Simulate detecting a random traffic sign
    const trafficSigns = [
      { type: "Speed Limit 30", count: 1, confidence: 0.92 },
      { type: "Stop Sign", count: 1, confidence: 0.95 },
      { type: "Yield", count: 1, confidence: 0.89 },
      { type: "No Entry", count: 1, confidence: 0.91 },
      { type: "Traffic Light", count: 1, confidence: 0.88 }
    ];
    
    // Randomly select a traffic sign
    const selectedSign = trafficSigns[Math.floor(Math.random() * trafficSigns.length)];
    
    return {
      objects: [selectedSign],
      modelUsed: 'traffic_sign'
    };
  }
  
  /**
   * Detect objects using YOLO model
   * @param imageData - The image data to process
   * @returns Detection results
   */
  async detectObjectsWithYolo(imageData: ImageData | null) {
    // In a real implementation, this would preprocess the image and run YOLO inference
    // For simulation, we'll return some dummy object detection data
    
    // Generate a random set of detected objects
    const objects = [];
    const possibleObjects = [
      { type: "Person", count: Math.floor(Math.random() * 3) + 1, confidence: 0.85 },
      { type: "Car", count: Math.floor(Math.random() * 5) + 1, confidence: 0.92 },
      { type: "Truck", count: Math.floor(Math.random() * 2), confidence: 0.88 },
      { type: "Bicycle", count: Math.floor(Math.random() * 2), confidence: 0.82 },
      { type: "Traffic Light", count: Math.floor(Math.random() * 2), confidence: 0.79 },
      { type: "Stop Sign", count: Math.floor(Math.random() * 1), confidence: 0.91 }
    ];
    
    // Add objects with non-zero counts
    possibleObjects.forEach(obj => {
      if (obj.count > 0) {
        objects.push(obj);
      }
    });
    
    return {
      objects,
      modelUsed: 'yolo'
    };
  }
  
  /**
   * Detect lanes in an image
   * @param imageData - The image data to process
   * @returns Lane detection results
   */
  async detectLanes(imageData: ImageData | null) {
    // In a real implementation, this would use computer vision techniques
    
    // Generate values based on image content if available
    let offset = 0;
    let direction = "Center";
    let confidence = 0.8;
    
    if (imageData) {
      // In a real implementation, we would analyze the image data
      // to detect lane lines and calculate the offset
      
      // For now, we'll generate more realistic values based on time
      // but with less extreme oscillation
      offset = Math.sin(Date.now() / 8000) * 25;
    } else {
      // Fallback to simulation if no image data
      offset = Math.sin(Date.now() / 8000) * 25;
    }
    
    // Determine direction based on offset
    if (Math.abs(offset) > 10) {
      direction = offset > 0 ? "Right" : "Left";
    }
    
    return {
      offset,
      direction,
      laneWidth: 350 + Math.sin(Date.now() / 10000) * 15, // More subtle lane width variation
      confidence: confidence,
      timestamp: Date.now()
    };
  }
  
  /**
   * Process the video directly for object detection
   * This method is more suitable for integration with the VideoFeed component
   * @param video - The video element
   * @param canvas - Canvas for drawing results
   * @param onDetection - Callback for results
   */
  processVideo(video: HTMLVideoElement, canvas: HTMLCanvasElement, onDetection: Function) {
    if (!canvas || !video) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    
    // Draw the current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get the image data for processing
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Process the frame with our models
    this.processFrame(imageData, (results: any) => {
      if (onDetection) {
        onDetection(results);
        
        // Draw detection boxes directly on the canvas for visualization
        this.drawDetectionResults(context, canvas.width, canvas.height, results);
      }
    });
  }
  
  /**
   * Draw detection results on the canvas
   * @param context - Canvas context
   * @param width - Canvas width
   * @param height - Canvas height
   * @param results - Detection results
   */
  drawDetectionResults(context: CanvasRenderingContext2D, width: number, height: number, results: any) {
    // Clear previous drawings
    context.clearRect(0, 0, width, height);
    
    // Draw detected objects
    if (results.objects && results.objects.length > 0) {
      results.objects.forEach((obj: any, i: number) => {
        // Determine color based on object type
        let color = '#3b82f6'; // blue default
        const lowerType = obj.type.toLowerCase();
        
        if (['person', 'pedestrian', 'bicycle', 'motorcycle'].includes(lowerType)) {
          color = '#ef4444'; // red for high risk
        } else if (['car', 'truck', 'bus', 'traffic light', 'stop sign'].includes(lowerType)) {
          color = '#f59e0b'; // amber for medium risk
        }
        
        // Generate realistic bounding boxes based on object type and position in frame
        // We'll place larger objects lower in the frame as they would appear in a real road scene
        const objectSeed = lowerType.charCodeAt(0) * (i + 1);
        let boxWidth, boxHeight, xPos, yPos;
        
        if (lowerType.includes('car') || lowerType.includes('truck') || lowerType.includes('bus')) {
          // Vehicles tend to be wider and in the middle-lower part of the frame
          boxWidth = width * (0.15 + Math.random() * 0.2);
          boxHeight = height * (0.1 + Math.random() * 0.15);
          xPos = width * (0.1 + (objectSeed % 7) * 0.1); // Distribute across lanes
          yPos = height * (0.5 + Math.random() * 0.3); // Lower half of frame
        } 
        else if (lowerType.includes('person') || lowerType.includes('pedestrian')) {
          // People are taller than wide and typically on the sides
          boxWidth = width * (0.05 + Math.random() * 0.03);
          boxHeight = height * (0.1 + Math.random() * 0.2);
          xPos = (objectSeed % 2 === 0) ? 
                 width * (0.05 + Math.random() * 0.2) : // Left side
                 width * (0.75 + Math.random() * 0.2);  // Right side
          yPos = height * (0.3 + Math.random() * 0.4);
        }
        else if (lowerType.includes('traffic light') || lowerType.includes('sign')) {
          // Signs are small and typically higher up in the frame
          boxWidth = width * (0.05 + Math.random() * 0.05);
          boxHeight = width * (0.05 + Math.random() * 0.05);
          xPos = width * (0.1 + (objectSeed % 8) * 0.1);
          yPos = height * (0.1 + Math.random() * 0.3); // Upper part of frame
        }
        else {
          // Default sizing for other objects
          boxWidth = width * (0.1 + Math.random() * 0.1);
          boxHeight = height * (0.1 + Math.random() * 0.1);
          xPos = width * (0.1 + Math.random() * 0.8);
          yPos = height * (0.2 + Math.random() * 0.6);
        }
        
        // Draw rectangle
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.strokeRect(xPos, yPos, boxWidth, boxHeight);
        
        // Draw semi-transparent fill
        context.fillStyle = `${color}33`; // 20% opacity
        context.fillRect(xPos, yPos, boxWidth, boxHeight);
        
        // Draw label background
        context.fillStyle = color;
        let label = obj.type;
        if (obj.count > 1) label += ` (${obj.count})`;
        
        // Add confidence if available
        if (obj.confidence) {
          const confidencePct = Math.round(obj.confidence * 100);
          label += ` ${confidencePct}%`;
        }
        
        context.font = '12px Arial';
        const labelWidth = context.measureText(label).width + 10;
        context.fillRect(xPos, yPos - 20, labelWidth, 20);
        
        // Draw label text
        context.fillStyle = '#ffffff';
        context.fillText(label, xPos + 5, yPos - 5);
      });
    }
    
    // Draw lane detection visualization at the bottom of the frame
    if (results.lanes) {
      const laneOffset = results.lanes.offset;
      const laneY = height * 0.8; // Position lanes in lower part of frame
      const laneHeight = height * 0.2;
      
      // Draw road background
      context.fillStyle = 'rgba(50, 50, 50, 0.6)';
      context.beginPath();
      context.moveTo(0, height);
      context.lineTo(0, laneY);
      context.lineTo(width, laneY);
      context.lineTo(width, height);
      context.closePath();
      context.fill();
      
      // Calculate lane positions with offset
      const centerX = width / 2;
      const offsetPixels = (laneOffset / 100) * (width * 0.2);
      const leftLane = centerX - width * 0.2 - offsetPixels;
      const rightLane = centerX + width * 0.2 - offsetPixels;
      
      // Draw lane lines
      context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      context.lineWidth = 3;
      
      // Left lane line
      context.beginPath();
      context.moveTo(leftLane, height);
      context.lineTo(leftLane * 0.9 + width * 0.05, laneY);
      context.stroke();
      
      // Right lane line
      context.beginPath();
      context.moveTo(rightLane, height);
      context.lineTo(rightLane * 0.9 + width * 0.05, laneY);
      context.stroke();
      
      // Draw center line (dashed)
      context.strokeStyle = 'rgba(255, 255, 0, 0.6)';
      context.lineWidth = 2;
      context.setLineDash([10, 10]);
      context.beginPath();
      context.moveTo(centerX - offsetPixels, height);
      context.lineTo(centerX - offsetPixels * 0.8, laneY);
      context.stroke();
      context.setLineDash([]);
      
      // Draw direction indicator
      context.font = '12px Arial';
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.fillText(`Lane offset: ${Math.abs(laneOffset).toFixed(1)}px ${results.lanes.direction}`, 
                      width - 150, height - 10);
    }
  }
}

export default new DetectionService();
