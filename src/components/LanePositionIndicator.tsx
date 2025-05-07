
import React from 'react';
import { useNavigation } from '@/context/NavigationContext';

interface LanePositionIndicatorProps {
  className?: string;
}

const LanePositionIndicator: React.FC<LanePositionIndicatorProps> = ({ className }) => {
  const { navigationState } = useNavigation();
  const { laneOffset } = navigationState;

  // Calculate the position of the car indicator based on offset value
  // Normalize the value to a percentage between -100 and 100
  const normalizedOffset = Math.max(-100, Math.min(100, laneOffset.value));
  const carPosition = `calc(50% + ${normalizedOffset / 2}%)`;
  
  // Determine color based on lane position
  const getPositionColor = () => {
    if (laneOffset.direction === "Center") return "bg-green-500";
    return "bg-red-500";
  };

  return (
    <div className={`navigation-panel ${className || ''}`}>
      <h2 className="text-lg font-bold mb-3">Lane Position</h2>
      
      <div className="relative h-10 bg-gray-800 rounded-lg mb-2">
        {/* Lane markers */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <div className="h-6 w-0.5 bg-gray-500"></div>
          <div className="h-8 w-0.5 bg-white"></div>
          <div className="h-6 w-0.5 bg-gray-500"></div>
        </div>
        
        {/* Car indicator */}
        <div 
          className={`absolute top-1 w-8 h-8 -ml-4 transition-all duration-300`}
          style={{ left: carPosition }}
        >
          <div className="relative">
            <div className={`w-8 h-3 ${getPositionColor()} rounded-t-md`}></div>
            <div className={`w-6 h-5 ${getPositionColor()} mx-auto rounded-b-sm`}></div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-t-red-500 border-l-transparent border-r-transparent opacity-75"></div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-2">
        <span className={`px-3 py-1 rounded ${laneOffset.direction === "Center" 
          ? "bg-green-900/50 text-green-400" 
          : "bg-red-900/50 text-red-400"}`}>
          {laneOffset.direction} ({laneOffset.value})
        </span>
      </div>
    </div>
  );
};

export default LanePositionIndicator;
