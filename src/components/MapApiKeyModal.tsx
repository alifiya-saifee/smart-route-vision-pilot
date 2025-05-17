
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

interface MapApiKeyModalProps {
  mapApiKey: string;
  setMapApiKey: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const MapApiKeyModal: React.FC<MapApiKeyModalProps> = ({
  mapApiKey,
  setMapApiKey,
  onSave,
  onCancel
}) => {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Maps API Key Required</DialogTitle>
          <DialogDescription>
            Enter your Serpi Maps API key to enable navigation features
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right text-sm font-medium col-span-1">
              API Key
            </label>
            <Input 
              id="map-api-key" 
              value={mapApiKey} 
              onChange={(e) => setMapApiKey(e.target.value)}
              placeholder="Your Serpi Maps API key"
              className="col-span-3"
            />
            <div className="col-span-4 text-xs text-muted-foreground">
              You can get your API key from the Serpi Maps developer dashboard at serpi.com/maps/developers
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!mapApiKey}>
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapApiKeyModal;
