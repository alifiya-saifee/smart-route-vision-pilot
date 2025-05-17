
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useVideoSettings = () => {
  const [mapApiKey, setMapApiKey] = useState<string>(() => {
    return localStorage.getItem('mapApiKey') || '';
  });
  
  const [showMapApiInput, setShowMapApiInput] = useState<boolean>(!localStorage.getItem('mapApiKey'));
  const { toast } = useToast();

  // Handle saving the map API key with debounce
  const handleSaveMapApiKey = useCallback(() => {
    localStorage.setItem('mapApiKey', mapApiKey);
    setShowMapApiInput(false);
    toast({
      title: "API key saved",
      description: "Map API key has been saved successfully"
    });
  }, [mapApiKey, toast]);

  return {
    mapApiKey,
    setMapApiKey,
    showMapApiInput,
    setShowMapApiInput,
    handleSaveMapApiKey
  };
};
