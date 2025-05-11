
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface MapApiKeyModalProps {
  mapApiKey: string;
  setMapApiKey: (key: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const MapApiKeyModal: React.FC<MapApiKeyModalProps> = ({
  mapApiKey,
  setMapApiKey,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();

  const handleSave = () => {
    if (mapApiKey.trim()) {
      onSave();
    } else {
      toast({
        variant: "destructive",
        title: "Invalid API key",
        description: "Please enter a valid API key"
      });
    }
  };

  return (
    <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-20 p-4">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Map API Key</h3>
        <p className="text-sm text-gray-400 mb-4">
          Please enter your Google Maps API key to enable route visualization
        </p>
        <Input
          value={mapApiKey}
          onChange={(e) => setMapApiKey(e.target.value)}
          placeholder="Enter Google Maps API Key"
          className="mb-4"
        />
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-navigation">
            Save & Enable
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapApiKeyModal;
