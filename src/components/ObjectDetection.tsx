
import React from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { AlertCircle, Car, User, Truck, Bus, Bike } from 'lucide-react';

interface ObjectDetectionProps {
  className?: string;
}

const ObjectDetection: React.FC<ObjectDetectionProps> = ({ className }) => {
  const { navigationState } = useNavigation();
  const { detectedObjects } = navigationState;

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
    if (lowerType === 'traffic light') return '🚦';
    if (lowerType === 'stop sign') return '🛑';
    return <AlertCircle className="w-5 h-5" />;
  };

  return (
    <div className={`navigation-panel ${className || ''}`}>
      <h2 className="text-lg font-bold mb-3">Detected Objects</h2>
      
      {detectedObjects.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <p>No objects detected</p>
        </div>
      ) : (
        <div className="space-y-3">
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
