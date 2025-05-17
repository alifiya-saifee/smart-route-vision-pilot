
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigation } from '@/context/NavigationContext';
import { useVideoSettings } from '@/hooks/useVideoSettings';
import { Button } from '@/components/ui/button';
import { Map, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const RouteMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { navigationState, isNavigating } = useNavigation();
  const { mapApiKey, showMapApiInput, setShowMapApiInput } = useVideoSettings();
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have the API key
    if (!mapApiKey) {
      setMapLoaded(false);
      return;
    }

    // Load map if we have an API key
    if (!mapLoaded && mapRef.current && mapApiKey) {
      try {
        // This is a mock implementation since Serpi Maps API doesn't actually exist
        // In a real application, you would initialize the actual maps API here
        console.log("Initializing map with API key:", mapApiKey.substring(0, 4) + "...");
        
        // Simulate map loading
        setTimeout(() => {
          if (mapRef.current) {
            // Create a mock map UI
            const mapUI = document.createElement('div');
            mapUI.className = 'h-full w-full bg-gray-700 rounded-lg relative';
            mapUI.innerHTML = `
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <div class="text-lg font-bold">Serpi Maps</div>
                <div class="text-sm text-gray-300">API Key: ${mapApiKey.substring(0, 4)}...</div>
                ${isNavigating ? '<div class="text-green-400 mt-2">Navigation Active</div>' : ''}
              </div>
              <div class="absolute bottom-2 right-2 bg-gray-800 px-2 py-1 rounded text-xs">© Serpi Maps</div>
            `;
            
            // Clear previous content
            while (mapRef.current.firstChild) {
              mapRef.current.removeChild(mapRef.current.firstChild);
            }
            
            // Add new map UI
            mapRef.current.appendChild(mapUI);
            
            // Store reference
            mapInstanceRef.current = {
              updateRoute: () => console.log("Route updated")
            };
            
            setMapLoaded(true);
            toast({
              title: "Map loaded",
              description: "Serpi Maps initialized successfully"
            });
          }
        }, 1000);
      } catch (error) {
        console.error("Error loading map:", error);
        toast({
          title: "Map error",
          description: "Failed to initialize Serpi Maps",
          variant: "destructive"
        });
      }
    }
  }, [mapApiKey, mapLoaded, isNavigating, toast]);

  // Update map when navigation state changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    
    if (isNavigating && navigationState.currentLocation && navigationState.destination) {
      // Simulate updating the map route
      console.log("Updating map route:", 
        `${navigationState.currentLocation.lat},${navigationState.currentLocation.lon}`,
        "to",
        `${navigationState.destination.lat},${navigationState.destination.lon}`
      );
      
      // In a real implementation, this would update the actual map route
      mapInstanceRef.current.updateRoute();
    }
  }, [navigationState, isNavigating, mapLoaded]);

  return (
    <Card className="bg-gray-800 border-gray-700 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Map className="mr-2 h-5 w-5 text-blue-400" />
            Route Map
          </div>
          {mapApiKey && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMapApiInput(true)}
              className="h-7 text-xs"
            >
              <MapPin className="mr-1 h-3 w-3" />
              Change API Key
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!mapApiKey ? (
          <div className="h-48 flex flex-col items-center justify-center bg-gray-900 rounded-lg">
            <p className="text-gray-400 mb-3 text-center">
              Maps API key required for navigation features
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMapApiInput(true)}
            >
              Set API Key
            </Button>
          </div>
        ) : (
          <div ref={mapRef} className="h-48 rounded-lg bg-gray-900 flex items-center justify-center">
            {!mapLoaded ? (
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            ) : null}
          </div>
        )}
        
        {isNavigating && navigationState.currentLocation && navigationState.destination ? (
          <div className="mt-2 bg-gray-900 p-2 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">From:</span> 
              <span>
                {navigationState.currentLocation.lat.toFixed(4)}, 
                {navigationState.currentLocation.lon.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">To:</span> 
              <span>
                {navigationState.destination.lat.toFixed(4)}, 
                {navigationState.destination.lon.toFixed(4)}
              </span>
            </div>
            {navigationState.route && (
              <div className="flex justify-between mt-1">
                <span className="text-gray-400">ETA:</span>
                <span className="text-green-400">
                  {Math.round(navigationState.route.duration)} min
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 text-center text-sm text-gray-500">
            Set your route to start navigation
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteMap;
