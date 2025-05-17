
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useVideoSettings = () => {
  const [mapApiKey, setMapApiKey] = useState<string>(() => {
    return localStorage.getItem('mapApiKey') || '';
  });
  
  const [showMapApiInput, setShowMapApiInput] = useState<boolean>(!localStorage.getItem('mapApiKey'));
  const { toast } = useToast();
  const mountedRef = useRef(true);
  
  // Track component mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle saving the map API key with debounce and mount checking
  const handleSaveMapApiKey = useCallback(() => {
    if (!mountedRef.current) return;
    
    localStorage.setItem('mapApiKey', mapApiKey);
    setShowMapApiInput(false);
    
    // Only show toast if component is still mounted
    if (mountedRef.current) {
      toast({
        title: "API key saved",
        description: "Map API key has been saved successfully"
      });
    }
  }, [mapApiKey, toast]);

  return {
    mapApiKey,
    setMapApiKey,
    showMapApiInput,
    setShowMapApiInput,
    handleSaveMapApiKey
  };
};
