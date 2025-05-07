
import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { AlertCircle, Car, User, Truck, Bus, Bike, TrafficLight, StopSign, Box } from 'lucide-react';
import { DetectedObject } from '@/types/navigation';

interface ObjectDetectionProps {
  className?: string;
}

const ObjectDetection: React.FC<ObjectDetectionProps> = ({ className }) => {
  const { navigationState } = useNavigation();
  const { detectedObjects } = navigationState;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Group objects by potential risk
  const highRiskObjects = detectedObjects.filter(obj => 
    ['person', 'bicycle', 'motorcycle', 'pedestrian'].includes(obj.type.toLowerCase())
  );
  
  const mediumRiskObjects = detectedObjects.filter(obj => 
    ['car', 'truck', 'bus', 'traffic light', 'stop sign'].includes(obj.type.toLowerCase())
  );
  
  const lowRiskObjects = detectedObjects.filter(obj => 
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
    if (lowerType === 'traffic light') return <TrafficLight className="w-5 h-5" />;
    if (lowerType === 'stop sign') return <StopSign className="w-5 h-5" />;
    return <Box className="w-5 h-5" />;
  };
  
  // Draw bounding boxes for detected objects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions to match parent container size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    // Generate mock positions for objects based on their type
    // This simulates what your Python code would do with real detections
    detectedObjects.forEach((obj, index) => {
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
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(xPos, yPos, boxWidth, boxHeight);
      
      // Draw label background
      ctx.fillStyle = color;
      const label = `${obj.type} (${obj.count})`;
      const labelWidth = ctx.measureText(label).width + 10;
      ctx.fillRect(xPos, yPos - 20, labelWidth, 20);
      
      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(label, xPos + 5, yPos - 5);
    });
  }, [detectedObjects]);

  return (
    <div className={`navigation-panel relative ${className || ''}`}>
      <h2 className="text-lg font-bold mb-3">Detected Objects</h2>
      
      {detectedObjects.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <p>No objects detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Visual representation of detected objects with bounding boxes */}
          <div className="relative h-[150px] bg-black/30 rounded">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full" 
            />
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
                      <span className="text-sm font-bold ml-1 text-white">{obj.count}</span>
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
                      <span className="text-sm font-bold ml-1 text-white">{obj.count}</span>
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
                      <span className="text-sm font-bold ml-1 text-white">{obj.count}</span>
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
