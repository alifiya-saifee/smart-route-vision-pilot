
import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { MapPin } from 'lucide-react';

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
  const [mapError, setMapError] = useState<string | null>(null);
  
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
    if (!key || !mapContainerRef.current || !route) {
      if (mapContainerRef.current && !route) {
        mapContainerRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">Set a route to display the map</div>';
      }
      return;
    }
    
    // Clear previous map and error state
    setMapError(null);
    mapContainerRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">Loading map...</div>';
    
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
      
      // Handle image load error
      img.onerror = () => {
        setMapError("Failed to load map. Please check your API key.");
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-red-400">Failed to load map. Please check your API key.</div>';
        }
      };
      
      // Handle successful image load
      img.onload = () => {
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = '';
          mapContainerRef.current.appendChild(img);
        }
      };
    } catch (error) {
      console.error('Error loading map:', error);
      setMapError("Error loading map");
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-red-400">Error loading map</div>';
      }
    }
  };

  // Load map when route changes or API key is set
  useEffect(() => {
    if (localStorage.getItem('mapApiKey')) {
      loadMap();
    }
  }, [route]);

  // Handle API key changes
  const openApiKeyInput = () => {
    setShowApiInput(true);
  };

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
          {mapError && (
            <div className="absolute top-2 right-2 z-10">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openApiKeyInput}
                className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
              >
                Update API Key
              </Button>
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
            {!route && (
              <div className="flex items-center justify-center flex-col text-gray-400">
                <MapPin className="h-8 w-8 mb-2 text-gray-500" />
                <p>Set a route to display the map</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMap;
