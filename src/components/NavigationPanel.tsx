
import React from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { Map, Navigation, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface NavigationPanelProps {
  className?: string;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({ className }) => {
  const { navigationState } = useNavigation();
  const { 
    route, 
    nextInstruction, 
    distanceToNextInstruction
  } = navigationState;

  return (
    <div className={`navigation-panel ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center">
          <Navigation className="w-5 h-5 mr-2 text-navigation" /> 
          Navigation Guidance
        </h2>
        {route && (
          <div className="text-sm">
            <span className="text-gray-400">ETA: </span>
            <span className="font-medium">{Math.ceil(route.duration)} min</span>
          </div>
        )}
      </div>
      
      {nextInstruction ? (
        <>
          <div className="bg-navigation/20 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-3 mb-2">
              {distanceToNextInstruction < 100 ? (
                <div className="w-10 h-10 rounded-full bg-navigation flex items-center justify-center animate-pulse-light">
                  <Navigation className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="font-bold">{Math.round(distanceToNextInstruction)}m</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{nextInstruction.instruction}</h3>
                {nextInstruction.name && (
                  <p className="text-sm text-gray-300">{nextInstruction.name}</p>
                )}
              </div>
            </div>
          </div>
          
          {route && (
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="text-gray-400">Distance: </span>
                <span className="font-medium">{route.distance.toFixed(1)} km</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-emergency" />
                <span className="text-gray-400">Destination: </span>
                <span className="font-medium ml-1">{route.name.split('to ')[1]}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <Map className="w-10 h-10 mx-auto mb-2 text-gray-500" />
          <p>No active navigation</p>
          <p className="text-sm text-gray-400">Set a destination to begin</p>
        </div>
      )}
    </div>
  );
};

export default NavigationPanel;
