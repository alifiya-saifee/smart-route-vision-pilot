
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  NavigationState,
  Location,
  Route,
  RouteInstruction,
  DetectedObject,
  LaneOffset,
  EmergencyStatus,
  WeatherInfo,
  CO2Savings,
  EmergencyLevel
} from '../types/navigation';
import { 
  mockRoute, 
  mockNextInstruction, 
  mockDetectedObjects, 
  mockLaneOffset, 
  mockEmergencyStatus, 
  mockWeatherInfo,
  mockCO2Savings,
  mockCurrentLocation,
  mockDestination,
  getUpdatedLocation
} from '../services/mockDataService';
import { useToast } from '@/components/ui/use-toast';

interface NavigationContextType {
  navigationState: NavigationState;
  setCurrentLocation: (location: Location) => void;
  setDestination: (destination: Location) => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  isNavigating: boolean;
  updateDetectedObjects: (objects: DetectedObject[]) => void;
  updateLaneOffset: (laneOffset: LaneOffset) => void;
  updateCO2Savings: () => void;
}

const initialState: NavigationState = {
  isRouteSet: false,
  currentLocation: null,
  destination: null,
  route: null,
  nextInstruction: null,
  distanceToNextInstruction: 0,
  detectedObjects: [],
  laneOffset: { value: 0, direction: "Center" },
  emergencyStatus: {
    active: false,
    level: "none",
    type: null,
    triggers: [],
    duration: 0
  },
  weather: null,
  co2Savings: { totalKg: 0, treesEquivalent: 0 }
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>(initialState);
  const [isNavigating, setIsNavigating] = useState(false);
  const [useAutoDetection, setUseAutoDetection] = useState(false);
  const { toast } = useToast();
  const startTimeRef = React.useRef<number>(Date.now());

  // Update simulation at regular intervals when navigating
  useEffect(() => {
    if (!isNavigating) return;

    // Initial setup
    if (!navigationState.isRouteSet) {
      const route = mockRoute();
      const detectedObjects = useAutoDetection ? [] : mockDetectedObjects();
      
      setNavigationState(prev => ({
        ...prev,
        isRouteSet: true,
        route: route,
        nextInstruction: route.instructions[0],
        distanceToNextInstruction: 200,
        weather: mockWeatherInfo(),
        co2Savings: mockCO2Savings(),
        detectedObjects: detectedObjects
      }));
      
      startTimeRef.current = Date.now();
      
      toast({
        title: "Navigation Started",
        description: `Navigating to destination, ${route.distance.toFixed(1)}km away`,
      });
    }

    // Main interval for regular updates
    const mainInterval = setInterval(() => {
      // Update location
      const newLocation = getUpdatedLocation(navigationState.currentLocation);
      
      // Update next instruction randomly (less frequently)
      const shouldUpdateInstruction = Math.random() > 0.9;
      const newInstruction = shouldUpdateInstruction ? mockNextInstruction() : navigationState.nextInstruction;
      const newDistance = shouldUpdateInstruction 
        ? Math.floor(Math.random() * 500) + 100 
        : Math.max(0, (navigationState.distanceToNextInstruction || 0) - 10);
      
      // Update weather info occasionally
      const newWeather = Math.random() > 0.95 ? mockWeatherInfo() : navigationState.weather;
      
      setNavigationState(prev => ({
        ...prev,
        currentLocation: newLocation,
        nextInstruction: newInstruction,
        distanceToNextInstruction: newDistance,
        weather: newWeather,
      }));
    }, 1000);
    
    // Separate interval for emergency statuses
    const emergencyInterval = setInterval(() => {
      // Update emergency status
      const newEmergencyStatus = mockEmergencyStatus();
      
      // If emergency status changes to critical from not critical
      if (newEmergencyStatus.level === "critical" && 
          navigationState.emergencyStatus.level !== "critical") {
        toast({
          variant: "destructive",
          title: "Emergency Alert",
          description: newEmergencyStatus.response || "Critical situation detected",
        });
      }
      
      setNavigationState(prev => ({
        ...prev,
        emergencyStatus: newEmergencyStatus,
        // Only update detected objects if not using auto detection
        ...(useAutoDetection ? {} : { detectedObjects: mockDetectedObjects() })
      }));
    }, 3000); // Update every 3 seconds

    return () => {
      clearInterval(mainInterval);
      clearInterval(emergencyInterval);
    };
  }, [isNavigating, navigationState.isRouteSet, toast, navigationState.emergencyStatus.level, navigationState.currentLocation, navigationState.distanceToNextInstruction, useAutoDetection]);

  const setCurrentLocation = (location: Location) => {
    setNavigationState(prev => ({
      ...prev,
      currentLocation: location
    }));
    toast({
      title: "Current Location Set",
      description: `Location set to ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`,
    });
  };

  const setDestination = (destination: Location) => {
    setNavigationState(prev => ({
      ...prev,
      destination
    }));
    toast({
      title: "Destination Set",
      description: `Destination set to ${destination.lat.toFixed(4)}, ${destination.lon.toFixed(4)}`,
    });
  };

  const startNavigation = () => {
    setIsNavigating(true);
    startTimeRef.current = Date.now();
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setNavigationState(prev => ({
      ...initialState,
      currentLocation: prev.currentLocation,
      destination: prev.destination,
    }));
    toast({
      title: "Navigation Ended",
      description: "You've completed your journey",
    });
  };
  
  const updateDetectedObjects = (objects: DetectedObject[]) => {
    setUseAutoDetection(true);
    setNavigationState(prev => ({
      ...prev,
      detectedObjects: objects
    }));
  };
  
  const updateLaneOffset = (laneOffset: LaneOffset) => {
    setNavigationState(prev => ({
      ...prev,
      laneOffset
    }));
  };
  
  const updateCO2Savings = () => {
    // Calculate CO2 savings based on time elapsed and some variables
    const timeElapsed = (Date.now() - startTimeRef.current) / 1000; // seconds
    
    // Base rate of CO2 savings per second (in kg)
    const baseRate = 0.0005;
    
    // Additional factors could be added here (speed, eco-driving, etc.)
    const savingsFactor = 1.0;
    
    // Calculate new total savings
    const newTotalKg = baseRate * timeElapsed * savingsFactor;
    
    // Tree equivalence: average tree absorbs about 21kg CO2 per year
    const treesEquivalent = (newTotalKg / 21) * 100; // As percentage of a tree's yearly absorption
    
    setNavigationState(prev => ({
      ...prev,
      co2Savings: {
        totalKg: newTotalKg,
        treesEquivalent: treesEquivalent
      }
    }));
  };

  return (
    <NavigationContext.Provider value={{ 
      navigationState, 
      setCurrentLocation,
      setDestination, 
      startNavigation, 
      stopNavigation,
      isNavigating,
      updateDetectedObjects,
      updateLaneOffset,
      updateCO2Savings
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
