
import { 
  Location,
  Route,
  RouteInstruction,
  DetectedObject,
  LaneOffset,
  EmergencyStatus,
  WeatherInfo,
  CO2Savings,
  EmergencyTrigger,
  EmergencyLevel
} from '../types/navigation';

// Mock data - replace with real data from APIs or other sources
export const mockRoute = (): Route => ({
  id: '1',
  name: 'Route to Destination',
  start: { lat: 52.5200, lon: 13.4050 }, // Berlin coordinates
  end: { lat: 48.8566, lon: 2.3522 },   // Paris coordinates
  distance: 878, // Kilometers
  duration: 527, // Minutes
  instructions: [
    { number: 1, distance: 50, duration: 1, instruction: 'Turn right', name: 'Street 1', coordinate: [13.4050, 52.5200] },
    { number: 2, distance: 100, duration: 2, instruction: 'Go straight', name: 'Street 2', coordinate: [13.4150, 52.5250] },
    { number: 3, distance: 200, duration: 3, instruction: 'Turn left', name: 'Street 3', coordinate: [13.4200, 52.5300] },
    { number: 4, distance: 50, duration: 1, instruction: 'Turn right', name: 'Street 4', coordinate: [13.4100, 52.5350] },
    { number: 5, distance: 300, duration: 4, instruction: 'Go straight', name: 'Street 5', coordinate: [13.4000, 52.5400] },
  ]
});

export const mockNextInstruction = (): RouteInstruction => ({
  number: 6,
  distance: 150,
  duration: 2,
  instruction: 'Continue onto Main Street',
  name: 'Main Street',
  coordinate: [13.4100, 52.5450]
});

export const mockDetectedObjects = (): DetectedObject[] => {
  // Common objects on the road
  const commonObjectTypes = [
    'Car', 'Pedestrian', 'Truck', 'Bus', 'Bicycle', 
    'Traffic Light', 'Stop Sign', 'Person', 'Motorcycle'
  ];
  
  // Generate a random number of objects to detect (2-7 objects)
  const numObjectsToDetect = Math.floor(Math.random() * 5) + 2;
  
  // Select random objects from the list
  const selectedObjects = new Set<string>();
  while (selectedObjects.size < numObjectsToDetect) {
    const randomIndex = Math.floor(Math.random() * commonObjectTypes.length);
    selectedObjects.add(commonObjectTypes[randomIndex]);
  }
  
  // Convert selected objects to DetectedObject array with random counts
  return Array.from(selectedObjects).map(type => ({
    type,
    count: Math.floor(Math.random() * 4) + 1 // Random count between 1 and 4
  }));
};

export const mockLaneOffset = (): LaneOffset => {
  const directions = ["Left", "Center", "Right", "Unknown"];
  const randomValue = (Math.random() * 1.5) - 0.75; // Random value between -0.75 and 0.75
  const randomDirection = directions[Math.floor(Math.random() * directions.length)] as LaneOffset["direction"];

  return {
    value: randomValue,
    direction: randomDirection
  };
};

export const mockEmergencyStatus = (): EmergencyStatus => {
  const levels: EmergencyLevel[] = ["none", "warning", "critical"];
  const types = ["Accident", "Obstruction", "Medical"];
  
  const active = Math.random() > 0.5;
  const level = active ? levels[Math.floor(Math.random() * levels.length)] : "none";
  const type = active && level !== "none" ? types[Math.floor(Math.random() * types.length)] : null;
  
  const triggers = active && level !== "none" ? [{
    type: "Speed",
    level: level as EmergencyLevel, // Ensure we're using the correct type
    details: "Speed exceeding limit"
  }] : [];
  
  return {
    active,
    level,
    type,
    triggers,
    duration: active ? Math.floor(Math.random() * 60) : 0,
    response: active && level === "critical" ? "Initiating emergency call" : undefined,
    action: active && level === "critical" ? "Slowing down vehicle" : undefined,
    initiate_call: active && level === "critical" ? Math.random() > 0.5 : undefined
  };
};

export const mockWeatherInfo = (): WeatherInfo => ({
  temperature: Math.floor(Math.random() * 30), // Random temperature between 0 and 30
  condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
  icon: 'weather-sunny',
  humidity: Math.floor(Math.random() * 100),
  wind: Math.floor(Math.random() * 50)
});

export const mockCO2Savings = (): CO2Savings => ({
  totalKg: Math.random() * 100,
  treesEquivalent: Math.random() * 5
});

export const mockCurrentLocation = (): Location => ({
  lat: 52.5200,
  lon: 13.4050
});

export const mockDestination = (): Location => ({
  lat: 48.8566,
  lon: 2.3522
});

export const getUpdatedLocation = (currentLocation: Location | null): Location => {
  if (!currentLocation) {
    return mockCurrentLocation();
  }
  
  // Simulate movement by small random adjustments
  const lat = currentLocation.lat + (Math.random() - 0.5) * 0.0005;
  const lon = currentLocation.lon + (Math.random() - 0.5) * 0.0005;
  
  return { lat, lon };
};
