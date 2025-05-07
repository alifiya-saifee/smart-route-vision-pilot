
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Location } from '@/types/navigation';

interface LocationInputProps {
  onSetLocation: (location: Location) => void;
  type: 'current' | 'destination';
}

const LocationInput: React.FC<LocationInputProps> = ({ onSetLocation, type }) => {
  const [lat, setLat] = useState<string>('');
  const [lon, setLon] = useState<string>('');

  const handleSetLocation = () => {
    if (lat && lon) {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      
      if (!isNaN(latNum) && !isNaN(lonNum)) {
        onSetLocation({ lat: latNum, lon: lonNum });
      }
    }
  };

  const getGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toString());
          setLon(position.coords.longitude.toString());
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      console.error('Geolocation is not available in this browser');
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-navigation" />
          {type === 'current' ? 'Current Location' : 'Destination'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label htmlFor={`${type}-lat`} className="text-sm text-gray-400">Latitude</Label>
            <Input 
              id={`${type}-lat`} 
              value={lat} 
              onChange={(e) => setLat(e.target.value)} 
              placeholder="e.g. 51.5074"
            />
          </div>
          <div>
            <Label htmlFor={`${type}-lon`} className="text-sm text-gray-400">Longitude</Label>
            <Input 
              id={`${type}-lon`} 
              value={lon} 
              onChange={(e) => setLon(e.target.value)} 
              placeholder="e.g. -0.1278"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          {type === 'current' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={getGeolocation}
            >
              Detect My Location
            </Button>
          )}
          <Button 
            size="sm"
            className="bg-navigation hover:bg-navigation-dark"
            onClick={handleSetLocation}
          >
            Set {type === 'current' ? 'Current' : 'Destination'} Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationInput;
