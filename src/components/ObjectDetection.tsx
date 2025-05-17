
import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { 
  AlertCircle, Car, User, Truck, Bus, Bike, CircleAlert, 
  Octagon, Box, AlertTriangle, BarChart
} from 'lucide-react';
import { DetectedObject } from '@/types/navigation';

// Define types
const DetectionModelType = {
  TRAFFIC_SIGN: 'TRAFFIC_SIGN',
  YOLO: 'YOLO',
  NONE: 'NONE'
};

interface ObjectDetectionProps {
  className?: string;
  confidenceThreshold?: number;
}

const ObjectDetection: React.FC<ObjectDetectionProps> = ({ 
  className,
  confidenceThreshold = 0.5
}) => {
  const { navigationState } = useNavigation();
  const { detectedObjects, laneOffset } = navigationState;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const laneCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activeModel, setActiveModel] = useState(DetectionModelType.NONE);
  const [modelStatus, setModelStatus] = useState('Loading models...');
  
  // Initialize object detectors
  useEffect(() => {
    let trafficModelLoaded = false;
    let yoloModelLoaded = false;
    
    const loadTrafficModel = async () => {
      try {
        // In a real implementation, you would use TensorFlow.js to load the models
        // For demo purposes, we'll simulate loading
        console.log('Loading traffic sign classifier model...');
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('Traffic sign classifier loaded successfully');
        trafficModelLoaded = true;
        setActiveModel(DetectionModelType.TRAFFIC_SIGN);
        setModelStatus('Using traffic sign classifier');
        
        // Start detection after model is loaded
        startObjectDetection();
      } catch (error) {
        console.error('Failed to load traffic sign classifier:', error);
        setModelStatus('Traffic sign model failed, using YOLO fallback');
        
        // If traffic model fails, try to load YOLO
        if (!yoloModelLoaded) {
          loadYoloModel();
        }
      }
    };
    
    const loadYoloModel = async () => {
      try {
        console.log('Loading YOLO model...');
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('YOLO model loaded successfully');
        yoloModelLoaded = true;
        
        // Only set to YOLO if traffic model failed
        if (!trafficModelLoaded) {
          setActiveModel(DetectionModelType.YOLO);
          setModelStatus('Using YOLO model');
          startObjectDetection();
        }
      } catch (error) {
        console.error('Failed to load YOLO model:', error);
        setModelStatus('All models failed to load');
      }
    };
    
    // Load models
    loadTrafficModel();
    
    // Cleanup function
    return () => {
      // Cleanup code for models if needed
    };
  }, []);
  
  // Mock function to simulate object detection
  const startObjectDetection = () => {
    // In a real app, this would connect to your webcam and process frames
    console.log('Starting object detection with model:', activeModel);
    
    // For demo purposes, we'll use the mock data already provided
    // In a real implementation, this would process video frames
  };
  
  // Filter objects by confidence threshold
  const filteredObjects = detectedObjects.filter(obj => 
    typeof obj.confidence === 'undefined' || obj.confidence >= confidenceThreshold
  );
  
  // Group objects by potential risk (using the logic from the existing code)
  const highRiskObjects = filteredObjects.filter(obj => 
    ['person', 'bicycle', 'motorcycle', 'pedestrian'].includes(obj.type.toLowerCase())
  );
  
  const mediumRiskObjects = filteredObjects.filter(obj => 
    ['car', 'truck', 'bus', 'traffic light', 'stop sign'].includes(obj.type.toLowerCase())
  );
  
  const lowRiskObjects = filteredObjects.filter(obj => 
    !['person', 'pedestrian', 'bicycle', 'motorcycle', 'car', 'truck', 'bus', 'traffic light', 'stop sign'].includes(obj.type.toLowerCase())
  );

  // Helper function to determine object icon
  const getObjectIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType === 'person' || lowerType === 'pedestrian') return <User className="w-5 h-5" />;
    if (lowerType === 'car') return <Car className="w-5 h-5" />;
    if (lowerType === 'truck') return <Truck className="w-5 h-5" />;
    if (lowerType === 'bus') return <Bus className="w-5 h-5" />;
    if (lowerType === 'bicycle' || lowerType === 'bike') return <Bike className="w-5 h-5" />;
    if (lowerType === 'traffic light') return <CircleAlert className="w-5 h-5" />;
    if (lowerType === 'stop sign') return <Octagon className="w-5 h-5" />;
    if (lowerType === 'traffic sign') return <AlertTriangle className="w-5 h-5" />;
    return <Box className="w-5 h-5" />;
  };
  
  // Draw bounding boxes for detected objects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Clear previous drawings
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions to match parent container size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    // Draw objects
    filteredObjects.forEach((obj, index) => {
      // Determine color based on risk level
      let color = '#3b82f6'; // blue for default
      const lowerType = obj.type.toLowerCase();
      
      if (['person', 'pedestrian', 'bicycle', 'motorcycle'].includes(lowerType)) {
        color = '#ef4444'; // red for high risk
      } else if (['car', 'truck', 'bus', 'traffic light', 'stop sign'].includes(lowerType)) {
        color = '#f59e0b'; // amber for medium risk
      }
      
      // Generate semi-random but stable positions based on object index and type
      const seed = index * 100 + obj.type.length;
      const boxWidth = 60 + (seed % 40);
      const boxHeight = 50 + (seed % 30);
      const xPos = (seed % (canvas.width - boxWidth - 20)) + 10;
      const yPos = ((seed * 3) % (canvas.height - boxHeight - 20)) + 10;
      
      // Draw rectangle
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(xPos, yPos, boxWidth, boxHeight);
      
      // Draw label background
      context.fillStyle = color;
      let label = `${obj.type} (${obj.count})`;
      
      // Add confidence if available
      if (typeof obj.confidence !== 'undefined') {
        label = `${obj.type} (${Math.round(obj.confidence * 100)}%)`;
      }
      
      const labelWidth = context.measureText(label).width + 10;
      context.fillRect(xPos, yPos - 20, labelWidth, 20);
      
      // Draw label text
      context.fillStyle = '#ffffff';
      context.font = '12px Arial';
      context.fillText(label, xPos + 5, yPos - 5);
    });
  }, [filteredObjects, confidenceThreshold]);
  
  // Draw lane detection visualization
  useEffect(() => {
    const canvas = laneCanvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas dimensions
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simulated lane lines
    const height = canvas.height;
    const width = canvas.width;
    
    // Draw road background
    context.fillStyle = 'rgba(50, 50, 50, 0.6)';
    context.beginPath();
    context.moveTo(width * 0.1, height);
    context.lineTo(width * 0.45, height * 0.6);
    context.lineTo(width * 0.55, height * 0.6);
    context.lineTo(width * 0.9, height);
    context.closePath();
    context.fill();
    
    // Draw lane area
    context.fillStyle = 'rgba(0, 200, 100, 0.3)';
    context.beginPath();
    context.moveTo(width * 0.3, height);
    context.lineTo(width * 0.47, height * 0.6);
    context.lineTo(width * 0.53, height * 0.6);
    context.lineTo(width * 0.7, height);
    context.closePath();
    context.fill();
    
    // Draw left lane line
    context.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(width * 0.3, height);
    context.lineTo(width * 0.47, height * 0.6);
    context.stroke();
    
    // Draw right lane line
    context.beginPath();
    context.moveTo(width * 0.7, height);
    context.lineTo(width * 0.53, height * 0.6);
    context.stroke();
    
    // Draw center line (dashed)
    context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    context.lineWidth = 2;
    context.setLineDash([10, 10]);
    context.beginPath();
    context.moveTo(width * 0.5, height);
    context.lineTo(width * 0.5, height * 0.6);
    context.stroke();
    context.setLineDash([]);
    
    // Draw vehicle indicator
    context.fillStyle = 'rgba(0, 150, 255, 0.8)';
    
    // Adjust car position based on lane offset
    const offsetPixels = (laneOffset.value / 100) * (width * 0.2); // Scale offset for visualization
    const carX = width * 0.5 + offsetPixels;
    
    context.beginPath();
    context.moveTo(carX, height - 20);
    context.lineTo(carX - 15, height - 5);
    context.lineTo(carX + 15, height - 5);
    context.closePath();
    context.fill();
  }, [laneOffset]);

  return (
    <div className={`navigation-panel relative ${className || ''}`}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Road Detection</h2>
        <div className="flex items-center gap-2">
          <div className="text-xs px-2 py-1 bg-blue-500/20 rounded text-blue-300">{modelStatus}</div>
          {confidenceThreshold > 0 && (
            <div className="text-xs px-2 py-1 bg-green-500/20 rounded text-green-300 flex items-center">
              <BarChart className="w-3 h-3 mr-1" />
              {Math.round(confidenceThreshold * 100)}% threshold
            </div>
          )}
        </div>
      </div>
      
      {/* Lane detection visualization */}
      <div className="space-y-3 mb-4">
        <h3 className="text-sm font-medium">Lane Detection</h3>
        <div className="relative h-[100px] bg-black/40 rounded overflow-hidden">
          <canvas 
            ref={laneCanvasRef} 
            className="w-full h-full" 
          />
          <div className="absolute bottom-2 right-2 bg-black/60 text-xs px-2 py-1 rounded text-white">
            Offset: {Math.abs(laneOffset.value)}px {laneOffset.direction}
          </div>
        </div>
      </div>
      
      {/* Object detection section */}
      <h3 className="text-sm font-medium mb-2">Object Detection</h3>
      
      {filteredObjects.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <p>{detectedObjects.length > 0 
            ? `No objects above ${Math.round(confidenceThreshold * 100)}% confidence threshold` 
            : "No objects detected"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Visual representation of detected objects with bounding boxes */}
          <div className="relative h-[150px] bg-black/30 rounded">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full" 
            />
            {detectedObjects.length > filteredObjects.length && (
              <div className="absolute top-2 right-2 bg-black/60 text-xs px-2 py-1 rounded text-white">
                Filtered out: {detectedObjects.length - filteredObjects.length} objects
              </div>
            )}
          </div>
          
          {highRiskObjects.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-red-400">High Attention</h3>
              <div className="grid grid-cols-2 gap-2">
                {highRiskObjects.map((obj, index) => (
                  <div 
                    key={`high-${index}`} 
                    className="flex items-center gap-2 bg-red-900/30 rounded px-2 py-1"
                  >
                    <span className="text-lg">{getObjectIcon(obj.type)}</span>
                    <div>
                      <span className="text-xs text-gray-300">{obj.type}</span>
                      {obj.confidence ? (
                        <span className="text-sm font-bold ml-1 text-white">{Math.round(obj.confidence * 100)}%</span>
                      ) : (
                        <span className="text-sm font-bold ml-1 text-white">{obj.count}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {mediumRiskObjects.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-yellow-400">Medium Attention</h3>
              <div className="grid grid-cols-2 gap-2">
                {mediumRiskObjects.map((obj, index) => (
                  <div 
                    key={`med-${index}`} 
                    className="flex items-center gap-2 bg-yellow-900/30 rounded px-2 py-1"
                  >
                    <span className="text-lg">{getObjectIcon(obj.type)}</span>
                    <div>
                      <span className="text-xs text-gray-300">{obj.type}</span>
                      {obj.confidence ? (
                        <span className="text-sm font-bold ml-1 text-white">{Math.round(obj.confidence * 100)}%</span>
                      ) : (
                        <span className="text-sm font-bold ml-1 text-white">{obj.count}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {lowRiskObjects.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-blue-400">Other Objects</h3>
              <div className="grid grid-cols-2 gap-2">
                {lowRiskObjects.map((obj, index) => (
                  <div 
                    key={`low-${index}`} 
                    className="flex items-center gap-2 bg-blue-900/30 rounded px-2 py-1"
                  >
                    <span className="text-lg">{getObjectIcon(obj.type)}</span>
                    <div>
                      <span className="text-xs text-gray-300">{obj.type}</span>
                      {obj.confidence ? (
                        <span className="text-sm font-bold ml-1 text-white">{Math.round(obj.confidence * 100)}%</span>
                      ) : (
                        <span className="text-sm font-bold ml-1 text-white">{obj.count}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ObjectDetection;
