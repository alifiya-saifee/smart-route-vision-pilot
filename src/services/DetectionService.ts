// This service handles the integration between the React frontend and detection models
// It simulates the bridge between our React app and models for object and lane detection
import VoiceAlertService from './VoiceAlertService';

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
  private lastLaneUpdate: number;
  private lanePatternOffset: number;
  private detectionWorker: Worker | null;
  private lastVoiceAlertTime: number;
  private lastLaneAlertDirection: string | null;
  private previousLaneOffset: number;
  private objectHistory: Map<string, {count: number, lastSeen: number}>;
  private emergencyMode: boolean;
  private lastCollisionCheck: number;
  private poiDatabase: Map<string, {lat: number, lon: number, type: string, name: string}>;

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
    this.lastLaneUpdate = 0;
    this.lanePatternOffset = 0;
    this.detectionWorker = null;
    this.lastVoiceAlertTime = 0;
    this.lastLaneAlertDirection = null;
    this.previousLaneOffset = 0;
    this.objectHistory = new Map();
    this.emergencyMode = false;
    this.lastCollisionCheck = 0;
    
    // Initialize Points of Interest database (simulated)
    this.poiDatabase = new Map();
    this.initializePoiDatabase();
    
    // Try to initialize a worker for offloading detection processing
    this.initializeDetectionWorker();
  }
  
  /**
   * Initialize a simulated points of interest database
   */
  private initializePoiDatabase() {
    // Mock data for hospitals
    this.poiDatabase.set('hospital1', {
      lat: 37.7749,
      lon: -122.4194,
      type: 'hospital',
      name: 'City Hospital'
    });
    
    this.poiDatabase.set('hospital2', {
      lat: 37.7833,
      lon: -122.4167,
      type: 'hospital',
      name: 'Medical Center'
    });
    
    // Mock data for gas stations
    this.poiDatabase.set('gas1', {
      lat: 37.7833,
      lon: -122.4264,
      type: 'gas',
      name: 'Downtown Gas'
    });
    
    this.poiDatabase.set('gas2', {
      lat: 37.7906,
      lon: -122.4238,
      type: 'gas',
      name: 'Quick Fuel'
    });
  }
  
  /**
   * Initialize a web worker for detection processing if supported
   */
  private initializeDetectionWorker() {
    // In a real implementation, this would instantiate a worker
    // for detection tasks to improve performance
    try {
      // This is just a simulation since we're not actually creating a worker file
      console.log("Initializing detection worker for improved performance");
    } catch (err) {
      console.warn("Web Workers not supported in this browser, falling back to main thread processing");
    }
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
   * Process the video directly for object detection
   * This method is optimized for real-time performance
   * @param video - The video element
   * @param canvas - Canvas for drawing results
   * @param onDetection - Callback for results
   */
  processVideo(video: HTMLVideoElement, canvas: HTMLCanvasElement, onDetection: Function) {
    if (!canvas || !video) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas dimensions to match video if needed
    // Only update dimensions when they don't match to avoid performance hit
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
    }
    
    // Draw the current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Process the frame more efficiently
    this.frameCount++;
    const now = Date.now();
    
    // Generate detection results based on video frame
    // Faster processing interval for real-time experience
    let objects = this.generateRealisticObjects(canvas.width, canvas.height);
    let lanes = this.generateRealisticLanes(canvas.width, canvas.height);
    let pois = this.getNearbyPOIs();
    
    // Check for collision risks - only periodically, not every frame
    if (now - this.lastCollisionCheck > 500) {
      this.checkCollisionRisks(objects, now);
      this.lastCollisionCheck = now;
    }
    
    // Check for significant detection events that need voice alerts
    // Do this less frequently to avoid too much processing
    if (now - this.lastVoiceAlertTime > 5000) {
      this.handleVoiceAlerts(objects, lanes, pois);
    }
    
    // Draw detection results with optimized rendering
    this.drawDetectionResultsOnVideo(context, canvas.width, canvas.height, objects, lanes);
    
    // Call the callback with the results
    if (onDetection && typeof onDetection === 'function') {
      onDetection({
        objects: objects,
        lanes: lanes,
        pois: pois,
        timestamp: now,
        emergency: this.emergencyMode
      });
    }
  }
  
  /**
   * Check for collision risks with nearby vehicles
   */
  private checkCollisionRisks(objects: any[], now: number) {
    // Only check periodically to avoid overwhelming the system
    if (now - this.lastCollisionCheck < 1000) return;
    this.lastCollisionCheck = now;
    
    // Check for vehicles that are too close
    const vehicles = objects.filter(obj => 
      ['car', 'truck', 'bus'].includes(obj.type.toLowerCase())
    );
    
    // Find closest vehicle and calculate distance
    let closestVehicle = null;
    let minDistance = Infinity;
    
    for (const vehicle of vehicles) {
      if (vehicle.distance && vehicle.distance < minDistance) {
        closestVehicle = vehicle;
        minDistance = vehicle.distance;
      }
    }
    
    // If a vehicle is too close, trigger emergency mode
    if (closestVehicle && minDistance < 15) {
      if (!this.emergencyMode) {
        this.emergencyMode = true;
        VoiceAlertService.setEmergencyMode(true);
      }
    } else if (this.emergencyMode && (!closestVehicle || minDistance > 40)) {
      // If we were in emergency mode but vehicles are now far enough away
      this.emergencyMode = false;
      VoiceAlertService.setEmergencyMode(false);
    }
  }
  
  /**
   * Get nearby points of interest (simulated)
   */
  private getNearbyPOIs() {
    const pois = [];
    const now = Date.now();
    
    // Simulate some POIs being detected randomly
    const detectHospital = Math.random() > 0.7;
    const detectGasStation = Math.random() > 0.6;
    
    if (detectHospital) {
      pois.push({
        type: 'hospital',
        name: 'City Hospital',
        distance: 1200 + Math.random() * 500, // meters
        direction: Math.random() > 0.5 ? 'ahead' : 'right',
        confidence: 0.8 + Math.random() * 0.15
      });
    }
    
    if (detectGasStation) {
      pois.push({
        type: 'gas',
        name: 'Quick Fuel',
        distance: 800 + Math.random() * 300, // meters
        direction: Math.random() > 0.7 ? 'ahead' : (Math.random() > 0.5 ? 'left' : 'right'),
        confidence: 0.7 + Math.random() * 0.2
      });
    }
    
    return pois;
  }
  
  /**
   * Handle voice alerts for significant detections
   */
  private handleVoiceAlerts(objects: any[], lanes: any, pois: any[]) {
    const now = Date.now();
    
    // Only process voice alerts every 2 seconds at most
    if (now - this.lastVoiceAlertTime < 2000) return;
    
    // Check for pedestrians (highest priority)
    const pedestrians = objects.filter(obj => 
      obj.type.toLowerCase() === 'person' || 
      obj.type.toLowerCase() === 'pedestrian'
    );
    
    if (pedestrians.length > 0) {
      VoiceAlertService.alertPedestrian(pedestrians.length);
      this.lastVoiceAlertTime = now;
      return; // Exit to avoid multiple alerts at once
    }
    
    // Check for lane departure
    const laneOffset = lanes.offset;
    if (Math.abs(laneOffset) > 20 && // Significant lane departure
        (this.lastLaneAlertDirection !== lanes.direction)) { // Direction changed
          
      VoiceAlertService.alertLaneDeparture(lanes.direction);
      this.lastLaneAlertDirection = lanes.direction;
      this.lastVoiceAlertTime = now;
      return;
    } else if (Math.abs(laneOffset) < 10) {
      // Reset lane alert direction when back in lane
      this.lastLaneAlertDirection = null;
    }
    
    // Check for vehicles that are close
    const vehicles = objects.filter(obj => 
      ['car', 'truck', 'bus'].includes(obj.type.toLowerCase())
    );
    
    // Find closest vehicle behind
    if (vehicles.length > 0) {
      const closestVehicle = vehicles.reduce((closest, current) => {
        if (!closest.distance) return current;
        if (!current.distance) return closest;
        return current.distance < closest.distance ? current : closest;
      });
      
      if (closestVehicle && closestVehicle.distance) {
        VoiceAlertService.alertVehicle(
          closestVehicle.type, 
          closestVehicle.distance,
          vehicles.length
        );
        this.lastVoiceAlertTime = now;
        return;
      }
    }
    
    // Check for traffic signs
    const trafficSigns = objects.filter(obj => 
      obj.type.toLowerCase() === 'stop sign' || 
      obj.type.toLowerCase() === 'traffic light'
    );
    
    if (trafficSigns.length > 0) {
      const signType = trafficSigns[0].type;
      // Check if this sign was recently spotted
      const signKey = `sign-${signType}`;
      if (!this.objectHistory.has(signKey)) {
        VoiceAlertService.alertTrafficSign(signType);
        this.objectHistory.set(signKey, {count: 1, lastSeen: now});
        this.lastVoiceAlertTime = now;
        return;
      }
    }
    
    // Check for Points of Interest
    if (pois.length > 0 && Math.random() > 0.7) { // Randomize POI alerts to avoid too many
      const poi = pois[0];
      VoiceAlertService.alertPOI(poi.type, poi.distance, poi.direction);
      this.lastVoiceAlertTime = now;
      return;
    }
    
    // Clean up object history (remove entries older than 10 seconds)
    this.objectHistory.forEach((value, key) => {
      if (now - value.lastSeen > 10000) {
        this.objectHistory.delete(key);
      }
    });
  }
  
  /**
   * Generate realistic-looking detected objects based on position in a road scene
   */
  generateRealisticObjects(width: number, height: number) {
    const objects = [];
    const possibleObjects = [
      { type: "Car", 
        probability: 0.9, 
        position: () => ({ 
          x: width * (0.3 + Math.random() * 0.4), 
          y: height * (0.5 + Math.random() * 0.2),
          w: width * (0.1 + Math.random() * 0.08),
          h: height * (0.05 + Math.random() * 0.04)
        })
      },
      { type: "Person", 
        probability: 0.3, 
        position: () => ({ 
          x: width * (Math.random() > 0.5 ? 0.05 : 0.85), 
          y: height * (0.5 + Math.random() * 0.3),
          w: width * 0.03,
          h: height * 0.1
        })
      },
      { type: "Truck", 
        probability: 0.2, 
        position: () => ({ 
          x: width * (0.3 + Math.random() * 0.4), 
          y: height * (0.4 + Math.random() * 0.2),
          w: width * (0.15 + Math.random() * 0.08),
          h: height * (0.08 + Math.random() * 0.05)
        })
      },
      { type: "Traffic Light", 
        probability: 0.4, 
        position: () => ({ 
          x: width * (Math.random() > 0.5 ? 0.1 : 0.85), 
          y: height * (0.2 + Math.random() * 0.2),
          w: width * 0.03,
          h: height * 0.05
        })
      },
      { type: "Stop Sign", 
        probability: 0.15, 
        position: () => ({ 
          x: width * (Math.random() > 0.5 ? 0.15 : 0.8), 
          y: height * (0.25 + Math.random() * 0.1),
          w: width * 0.04,
          h: height * 0.04
        })
      },
      { type: "Bicycle", 
        probability: 0.2, 
        position: () => ({ 
          x: width * (Math.random() > 0.5 ? 0.1 : 0.85), 
          y: height * (0.6 + Math.random() * 0.2),
          w: width * 0.04,
          h: height * 0.07
        })
      },
      // Add car behind for collision detection
      { type: "Car Behind", 
        probability: 0.6, 
        position: () => ({ 
          x: width * (0.4 + Math.random() * 0.2), 
          y: height * (0.85 + Math.random() * 0.1),
          w: width * (0.15 + Math.random() * 0.05),
          h: height * (0.08 + Math.random() * 0.03)
        })
      }
    ];
    
    // Generate a somewhat realistic number of objects
    // More likely to see cars than anything else
    possibleObjects.forEach(obj => {
      // Random check based on probability
      if (Math.random() < obj.probability) {
        // Some objects might appear multiple times
        const count = obj.type === "Car" ? Math.floor(Math.random() * 3) + 1 : 1;
        
        for (let i = 0; i < count; i++) {
          const pos = obj.position();
          
          // Calculate simulated distance
          const distance = obj.type === "Car Behind" 
            ? (Math.random() * 45) // Random distance for car behind (0-45 meters)
            : 50 + Math.random() * 50; // Further for other objects
          
          // Add emergency car with low probability
          let emergencyVehicle = false;
          if ((obj.type === "Car" || obj.type === "Truck") && Math.random() > 0.95) {
            emergencyVehicle = true;
          }
          
          objects.push({
            type: obj.type === "Car Behind" ? "Car" : obj.type, // Normalize the type
            count: 1,
            confidence: 0.7 + Math.random() * 0.25,
            distance: distance,
            emergency: emergencyVehicle,
            boundingBox: {
              x: pos.x + (i * pos.w * 0.5), // Offset multiple cars
              y: pos.y,
              width: pos.w,
              height: pos.h
            }
          });
        }
      }
    });
    
    return objects;
  }

  /**
   * Generate realistic lane detection results - optimized for real-time
   */
  generateRealisticLanes(width: number, height: number) {
    const now = Date.now();
    
    // Update lane pattern offset at a fixed interval - more efficient update
    if (now - this.lastLaneUpdate > 35) { // Faster updates for smoother animation
      this.lastLaneUpdate = now;
      this.lanePatternOffset += 0.7; // move the pattern down faster
      if (this.lanePatternOffset > 50) this.lanePatternOffset = 0;
    }
    
    // Generate a smooth drifting offset to simulate car moving in lane
    const offsetCycle = Math.sin(now / 8000) * 25;
    const direction = offsetCycle > 10 ? "Right" : 
                     offsetCycle < -10 ? "Left" : 
                     "Center";
    
    return {
      offset: offsetCycle,
      direction: direction,
      patternOffset: this.lanePatternOffset, // Used for drawing dashed lines
      confidence: 0.85 + Math.random() * 0.1,
      leftLineDetected: true,
      rightLineDetected: true,
      centerLineDetected: Math.random() > 0.2, // Sometimes lose center line detection
      laneWidth: 350 + Math.sin(now / 10000) * 15 // Slight variation in detected lane width
    };
  }
  
  /**
   * Draw detection results directly on the video canvas
   * Optimized for performance in real-time scenarios
   */
  drawDetectionResultsOnVideo(ctx: CanvasRenderingContext2D, width: number, height: number, objects: any[], lanes: any) {
    // Use lighter overlay for better performance
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw lane markings first (behind objects)
    this.drawLaneOverlay(ctx, width, height, lanes);
    
    // Optimize object rendering by limiting objects drawn
    // Draw at most 10 objects to maintain performance
    const maxObjectsToDraw = 10;
    const objectsToDraw = objects.slice(0, maxObjectsToDraw);
    objectsToDraw.forEach(obj => this.drawObjectOverlay(ctx, obj));
    
    // Draw emergency indicator if active
    if (this.emergencyMode) {
      this.drawEmergencyOverlay(ctx, width, height);
    }
  }
  
  /**
   * Draw emergency overlay when in emergency mode
   */
  private drawEmergencyOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Draw red border
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, width, height);
    
    // Draw distance warning
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.font = 'bold 24px Arial';
    const warningText = 'COLLISION RISK';
    const textWidth = ctx.measureText(warningText).width;
    ctx.fillText(warningText, (width - textWidth) / 2, height - 40);
  }
  
  /**
   * Draw lane detection overlay - optimized for real-time visualization
   */
  drawLaneOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, lanes: any) {
    // Define horizon point (perspective vanishing point)
    const horizonY = height * 0.55;
    
    // Define lane starting position (at bottom of canvas)
    const laneWidth = lanes.laneWidth;
    const centerX = width / 2;
    const laneOffset = lanes.offset || 0;
    
    // Calculate lane positions with offset 
    const offsetPixels = (laneOffset / 100) * (width * 0.1);
    
    // Bottom positions (wide)
    const bottomLeftX = centerX - (laneWidth/2) - offsetPixels;
    const bottomRightX = centerX + (laneWidth/2) - offsetPixels;
    
    // Top positions (narrow due to perspective)
    const topLeftX = centerX - (laneWidth * 0.2) - (offsetPixels * 0.3);
    const topRightX = centerX + (laneWidth * 0.2) - (offsetPixels * 0.3);
    
    // Draw solid edge lines with increased visibility
    ctx.lineWidth = 5;
    
    // Left lane line - Thicker yellow line for better visibility
    ctx.strokeStyle = 'rgba(255, 255, 100, 0.95)';  // More opaque yellow
    ctx.beginPath();
    ctx.moveTo(bottomLeftX, height);
    ctx.lineTo(topLeftX, horizonY);
    ctx.stroke();
    
    // Right lane line - Thicker white line for better visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';  // More opaque white
    ctx.beginPath();
    ctx.moveTo(bottomRightX, height);
    ctx.lineTo(topRightX, horizonY);
    ctx.stroke();
    
    // Draw center dashed line with improved visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;
    
    // Create a vertical pattern of dashes for the center lane
    // Larger dash height for better visibility
    const dashHeight = 25;
    const dashGap = 15;
    const dashStart = lanes.patternOffset || 0; // Moving offset creates animation
    
    // Create an array of dash start Y-positions from bottom to horizon
    let dashPositions = [];
    for (let y = height - dashStart % (dashHeight + dashGap); y > horizonY; y -= dashHeight + dashGap) {
      // Calculate how far up we are (0 at bottom, 1 at horizon)
      const progressToHorizon = 1 - ((y - horizonY) / (height - horizonY));
      
      // Calculate x-position with perspective
      const xPos = centerX - offsetPixels * (1 - progressToHorizon * 0.7);
      
      // Calculate dash width and height with perspective
      const perspectiveDashHeight = dashHeight * (1 - progressToHorizon * 0.7);
      
      dashPositions.push({
        x: xPos,
        y: y,
        height: perspectiveDashHeight
      });
    }
    
    // Draw dashes with perspective and improved visibility
    dashPositions.forEach(dash => {
      // Calculate x-coordinates with perspective
      const bottomY = dash.y;
      const topY = dash.y - dash.height;
      
      // Calculate how far up we are (0 at bottom, 1 at horizon) for both ends of dash
      const bottomProgress = 1 - ((bottomY - horizonY) / (height - horizonY));
      const topProgress = 1 - ((topY - horizonY) / (height - horizonY));
      
      // Perspective width adjustments - wider dashes for better visibility
      const bottomWidth = 3 * (1 - bottomProgress * 0.7);
      const topWidth = 3 * (1 - topProgress * 0.7);
      
      // Draw the dash as a trapezoid to account for perspective
      ctx.beginPath();
      ctx.moveTo(dash.x - bottomWidth, bottomY);
      ctx.lineTo(dash.x + bottomWidth, bottomY);
      ctx.lineTo(dash.x + topWidth, topY);
      ctx.lineTo(dash.x - topWidth, topY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    });
    
    // Draw status text with better visibility
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(0, 255, 200, 1.0)';
    ctx.fillText(`Lane offset: ${Math.abs(lanes.offset).toFixed(1)}px ${lanes.direction}`, width - 160, height - 10);
    ctx.fillText(`Confidence: ${(lanes.confidence * 100).toFixed(0)}%`, width - 160, height - 25);
    
    // Draw car position indicator at bottom with improved visibility
    this.drawCarPositionIndicator(ctx, width, height, offsetPixels);
  }
  
  /**
   * Draw car position indicator at bottom of screen
   */
  drawCarPositionIndicator(ctx: CanvasRenderingContext2D, width: number, height: number, offsetPixels: number) {
    const centerX = width / 2;
    const carX = centerX - offsetPixels;
    const carY = height - 20;
    
    ctx.fillStyle = 'rgba(0, 200, 255, 0.9)';
    
    // Draw a car indicator
    ctx.beginPath();
    ctx.moveTo(carX, carY - 15);
    ctx.lineTo(carX - 10, carY);
    ctx.lineTo(carX + 10, carY);
    ctx.closePath();
    ctx.fill();
    
    // Draw center marker
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(centerX, height - 5);
    ctx.lineTo(centerX, height - 15);
    ctx.stroke();
  }
  
  /**
   * Draw object detection boxes with improved real-time visualization
   */
  drawObjectOverlay(ctx: CanvasRenderingContext2D, object: any) {
    if (!object.boundingBox) return;
    
    const { x, y, width, height } = object.boundingBox;
    const type = object.type;
    const confidence = object.confidence;
    const distance = object.distance || null;
    const isEmergency = object.emergency || false;
    
    // Define color based on object type - with improved color contrast
    let color;
    switch (type.toLowerCase()) {
      case 'person':
      case 'pedestrian':
        color = '#ff2020'; // Brighter red for high risk
        break;
      case 'bicycle':
      case 'motorcycle':
        color = '#ff6060'; // Light red for high risk
        break;  
      case 'car':
      case 'truck':
      case 'bus':
        color = isEmergency ? '#ff00ff' : '#ffaa00'; // Special color for emergency vehicles
        break;
      case 'traffic light':
      case 'stop sign':
        color = '#ffdd00'; // Bright yellow for traffic controls
        break;
      default:
        color = '#40a0ff'; // Brighter blue for default
    }
    
    // Draw bounding box with animated pulsing effect for important objects
    ctx.lineWidth = 3;
    
    // Apply pulsing effect to high priority objects
    if (['person', 'pedestrian', 'bicycle', 'motorcycle', 'traffic light', 'stop sign'].includes(type.toLowerCase()) || isEmergency) {
      const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5; // Pulse between 0 and 1
      ctx.strokeStyle = color;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
      
      // Inner highlight that pulses
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3 + pulse * 0.7;
      ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
      ctx.globalAlpha = 1.0;
    } else {
      // Regular objects
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, width, height);
    }
    
    // Add semi-transparent fill with improved visibility
    ctx.fillStyle = `${color}33`; // 20% opacity
    ctx.fillRect(x, y, width, height);
    
    // Draw label with improved visibility
    const labelText = isEmergency 
      ? `${type} (Emergency)` 
      : distance 
        ? `${type} ${Math.round(confidence * 100)}% - ${distance.toFixed(1)}m` 
        : `${type} ${Math.round(confidence * 100)}%`;
    
    ctx.font = '13px Arial';
    
    // Draw label background
    ctx.fillStyle = isEmergency ? '#ff00ff' : color;
    const labelWidth = ctx.measureText(labelText).width + 10;
    ctx.fillRect(x, y - 22, labelWidth, 22);
    
    // Draw label text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(labelText, x + 5, y - 6);
    
    // Draw tracking lines and distance estimates for some objects with improved visibility
    if (['car', 'truck', 'bus', 'person', 'pedestrian'].includes(type.toLowerCase())) {
      // Draw tracking line
      ctx.beginPath();
      ctx.moveTo(x + width/2, y + height);
      ctx.lineTo(x + width/2, y + height + 25);
      ctx.strokeStyle = `${color}cc`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw distance estimate
      let displayDistance = distance ? distance.toFixed(1) : (50 / height * 100).toFixed(1);
      ctx.fillStyle = distance && distance < 30 ? '#ff3333dd' : `${color}dd`;
      ctx.font = distance && distance < 30 ? 'bold 12px Arial' : '12px Arial';
      ctx.fillText(`${displayDistance}m`, x + width/2 - 15, y + height + 40);
      
      // Add warning indicator for close objects
      if (distance && distance < 15) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        const warningX = x + width/2;
        const warningY = y + height + 55;
        ctx.arc(warningX, warningY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        const warningTextWidth = ctx.measureText('!').width;
        ctx.fillText('!', warningX - warningTextWidth/2, warningY + 5);
      }
    }
  }
}

export default new DetectionService();
