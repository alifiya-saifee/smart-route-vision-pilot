
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
  CO2Savings
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
  const { toast } = useToast();

  // Update simulation at regular intervals when navigating
  useEffect(() => {
    if (!isNavigating) return;

    // Initial setup
    if (!navigationState.isRouteSet) {
      const route = mockRoute();
      setNavigationState(prev => ({
        ...prev,
        isRouteSet: true,
        route: route,
        nextInstruction: route.instructions[0],
        distanceToNextInstruction: 200,
        weather: mockWeatherInfo(),
        co2Savings: mockCO2Savings()
      }));
      
      toast({
        title: "Navigation Started",
        description: `Navigating to destination, ${route.distance.toFixed(1)}km away`,
      });
    }

    const interval = setInterval(() => {
      // Update location
      const newLocation = getUpdatedLocation(navigationState.currentLocation);
      
      // Update lane offset
      const newLaneOffset = mockLaneOffset();
      
      // Update detected objects randomly (less frequently)
      const newDetectedObjects = Math.random() > 0.7 
        ? mockDetectedObjects() 
        : navigationState.detectedObjects;
      
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

      // Update next instruction randomly (less frequently)
      const shouldUpdateInstruction = Math.random() > 0.9;
      const newInstruction = shouldUpdateInstruction ? mockNextInstruction() : navigationState.nextInstruction;
      const newDistance = shouldUpdateInstruction 
        ? Math.floor(Math.random() * 500) + 100 
        : Math.max(0, (navigationState.distanceToNextInstruction || 0) - 10);
      
      // Update weather info occasionally
      const newWeather = Math.random() > 0.95 ? mockWeatherInfo() : navigationState.weather;
      
      // Update CO2 savings
      const oldSavings = navigationState.co2Savings;
      const newSavings = {
        totalKg: oldSavings.totalKg + 0.01,
        treesEquivalent: parseFloat(((oldSavings.totalKg + 0.01) / 21 * 100).toFixed(1))
      };
      
      setNavigationState(prev => ({
        ...prev,
        currentLocation: newLocation,
        nextInstruction: newInstruction,
        distanceToNextInstruction: newDistance,
        detectedObjects: newDetectedObjects,
        laneOffset: newLaneOffset,
        emergencyStatus: newEmergencyStatus,
        weather: newWeather,
        co2Savings: newSavings
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isNavigating, navigationState.isRouteSet, toast]);

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

  return (
    <NavigationContext.Provider value={{ 
      navigationState, 
      setCurrentLocation,
      setDestination, 
      startNavigation, 
      stopNavigation,
      isNavigating
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
