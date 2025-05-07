
import React, { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import LocationInput from '@/components/LocationInput';
import { Location } from '@/types/navigation';

interface RouteControlsProps {
  className?: string;
}

const RouteControls: React.FC<RouteControlsProps> = ({ className }) => {
  const { navigationState, startNavigation, stopNavigation, isNavigating, setCurrentLocation, setDestination } = useNavigation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleStartNavigation = () => {
    if (navigationState.currentLocation && navigationState.destination) {
      setIsDialogOpen(false);
      startNavigation();
    } else {
      alert('Please set both current location and destination first');
    }
  };

  return (
    <>
      <div className={`flex justify-center space-x-3 ${className || ''}`}>
        {!isNavigating ? (
          <Button 
            variant="default" 
            className="bg-navigation hover:bg-navigation-dark"
            onClick={() => setIsDialogOpen(true)}
          >
            <Navigation className="mr-2 h-4 w-4" />
            Start Navigation
          </Button>
        ) : (
          <Button 
            variant="destructive"
            onClick={stopNavigation}
          >
            Stop Navigation
          </Button>
        )}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Set Route
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <LocationInput 
              type="current" 
              onSetLocation={setCurrentLocation} 
            />
            
            <LocationInput 
              type="destination" 
              onSetLocation={setDestination} 
            />
            
            <div className="text-sm text-muted-foreground">
              For this demo, you can enter any coordinates. The system will simulate a route.
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartNavigation}
              className="bg-navigation hover:bg-navigation-dark"
              disabled={!navigationState.currentLocation || !navigationState.destination}
            >
              Navigate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RouteControls;
