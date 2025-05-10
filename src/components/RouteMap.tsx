
import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface RouteMapProps {
  className?: string;
}

const RouteMap: React.FC<RouteMapProps> = ({ className }) => {
  const { navigationState } = useNavigation();
  const { route } = navigationState;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('mapApiKey') || '';
  });
  const [showApiInput, setShowApiInput] = useState<boolean>(!localStorage.getItem('mapApiKey'));
  const { toast } = useToast();
  
  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('mapApiKey', apiKey);
      setShowApiInput(false);
      toast({
        title: "API key saved",
        description: "Your map API key has been saved for this session"
      });
      loadMap();
    } else {
      toast({
        variant: "destructive",
        title: "Invalid API key",
        description: "Please enter a valid API key"
      });
    }
  };

  const loadMap = () => {
    const key = localStorage.getItem('mapApiKey');
    if (!key || !mapContainerRef.current || !route) return;
    
    // Clear previous map
    mapContainerRef.current.innerHTML = '';
    
    // Create map image URL
    try {
      const startLat = route.start.lat;
      const startLon = route.start.lon;
      const endLat = route.end.lat;
      const endLon = route.end.lon;
      
      // Create a static map with route
      const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&path=color:0x0000ff|weight:5|${startLat},${startLon}|${endLat},${endLon}&markers=color:green|label:S|${startLat},${startLon}&markers=color:red|label:E|${endLat},${endLon}&key=${key}`;
      
      // Create an image element
      const img = document.createElement('img');
      img.src = mapUrl;
      img.alt = 'Route Map';
      img.className = 'w-full h-full object-cover rounded-lg';
      
      // Add image to container
      mapContainerRef.current.appendChild(img);
    } catch (error) {
      console.error('Error loading map:', error);
      mapContainerRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-red-400">Error loading map</div>';
    }
  };

  useEffect(() => {
    if (route && localStorage.getItem('mapApiKey')) {
      loadMap();
    }
  }, [route]);

  return (
    <div className={`h-full ${className || ''}`}>
      {showApiInput ? (
        <div className="bg-gray-800 rounded-lg p-4 h-full flex flex-col items-center justify-center">
          <h3 className="text-white text-lg mb-4">Map API Key Required</h3>
          <p className="text-gray-300 text-sm mb-4 text-center">
            Please enter a Google Maps API key to display the route map
          </p>
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter Google Maps API Key"
            className="mb-4 w-full max-w-md"
          />
          <Button onClick={handleSaveApiKey} className="bg-navigation hover:bg-navigation-dark">
            Save API Key
          </Button>
        </div>
      ) : (
        <div className="h-full">
          {route ? (
            <div ref={mapContainerRef} className="w-full h-full bg-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading map...
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
              <p className="text-gray-400">Set a route to display the map</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteMap;
