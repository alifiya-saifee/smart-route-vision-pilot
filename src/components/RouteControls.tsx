
import React, { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RouteControlsProps {
  className?: string;
}

const RouteControls: React.FC<RouteControlsProps> = ({ className }) => {
  const { navigationState, startNavigation, stopNavigation, isNavigating } = useNavigation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [destination, setDestination] = useState('');

  const handleStartNavigation = () => {
    // In a real app, we'd validate the destination and convert it to coordinates here
    setIsDialogOpen(false);
    startNavigation();
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Set Destination
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="destination" className="text-right">
                Destination
              </Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination"
                className="col-span-3"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              For this demo, you can enter any destination. The system will simulate a route.
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
