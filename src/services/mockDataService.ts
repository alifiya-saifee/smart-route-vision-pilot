
import { 
  Location, 
  Route, 
  RouteInstruction, 
  DetectedObject, 
  LaneOffset, 
  EmergencyStatus,
  WeatherInfo,
  CO2Savings
} from '../types/navigation';

// OpenRouteService API Key (this is just for display, actual requests are mocked)
const ORS_API_KEY = "5b3ce3597851110001cf62484146d40ac46542658d32b2ca9292718b";

export const mockCurrentLocation = (): Location => {
  // Central London coordinates
  return { lat: 51.5074, lon: -0.1278 };
};

export const mockDestination = (): Location => {
  // Heathrow Airport
  return { lat: 51.4700, lon: -0.4543 };
};

export const mockRoute = (): Route => {
  return {
    id: "route-1",
    name: "London to Heathrow",
    start: mockCurrentLocation(),
    end: mockDestination(),
    distance: 23.5,
    duration: 35,
    instructions: [
      {
        number: 1,
        distance: 200,
        duration: 30,
        instruction: "Head west on Oxford Street",
        name: "Oxford Street",
        coordinate: [-0.1281, 51.5074]
      },
      {
        number: 2,
        distance: 1500,
        duration: 120,
        instruction: "Turn left onto Regent Street",
        name: "Regent Street",
        coordinate: [-0.1419, 51.5098]
      },
      {
        number: 3,
        distance: 3000,
        duration: 240,
        instruction: "Continue onto Piccadilly",
        name: "Piccadilly",
        coordinate: [-0.1543, 51.5072]
      },
      {
        number: 4,
        distance: 15000,
        duration: 600,
        instruction: "Turn right onto M4 towards Heathrow",
        name: "M4",
        coordinate: [-0.2401, 51.4912]
      },
      {
        number: 5,
        distance: 3800,
        duration: 180,
        instruction: "Take exit 4 towards Heathrow Terminals 2 & 3",
        name: "M4 Exit 4",
        coordinate: [-0.4322, 51.4789]
      }
    ]
  };
};

export const mockNextInstruction = (): RouteInstruction => {
  return {
    number: 2,
    distance: 350,
    duration: 45,
    instruction: "In 350 meters, turn left onto Regent Street",
    name: "Regent Street",
    coordinate: [-0.1419, 51.5098]
  };
};

export const mockDetectedObjects = (): DetectedObject[] => {
  return [
    { type: 'car', count: 4 },
    { type: 'person', count: 2 },
    { type: 'truck', count: 1 },
    { type: 'traffic light', count: 1 }
  ];
};

export const mockLaneOffset = (): LaneOffset => {
  // Randomly choose between Left, Center, Right with varying values
  const directions: ("Left" | "Center" | "Right")[] = ["Left", "Center", "Right"];
  const direction = directions[Math.floor(Math.random() * 3)];
  
  // Generate a random offset value based on direction
  let offsetValue = 0;
  if (direction === "Center") {
    offsetValue = Math.floor(Math.random() * 30) - 15; // -15 to 15
  } else if (direction === "Left") {
    offsetValue = -(Math.floor(Math.random() * 80) + 30); // -30 to -110
  } else {
    offsetValue = Math.floor(Math.random() * 80) + 30; // 30 to 110
  }
  
  return {
    value: offsetValue,
    direction: direction
  };
};

export const mockEmergencyStatus = (): EmergencyStatus => {
  // Most of the time, no emergency
  if (Math.random() > 0.1) {
    return {
      active: false,
      level: "none",
      type: null,
      triggers: [],
      duration: 0
    };
  }
  
  // Sometimes warning
  if (Math.random() > 0.3) {
    return {
      active: true,
      level: "warning",
      type: "lane_departure",
      triggers: [
        {
          type: "lane_departure",
          level: "warning",
          details: "Lane departure detected"
        }
      ],
      duration: Math.floor(Math.random() * 5) + 1,
      response: "Warning: Lane departure detected. Adjust steering."
    };
  }
  
  // Rarely critical
  return {
    active: true,
    level: "critical",
    type: "collision_risk",
    triggers: [
      {
        type: "collision_risk",
        level: "critical",
        details: "Multiple pedestrians (3) detected at high speed"
      }
    ],
    duration: Math.floor(Math.random() * 10) + 3,
    response: "CRITICAL: Imminent collision risk! Apply brakes immediately!",
    action: "brake",
    initiate_call: true
  };
};

export const mockWeatherInfo = (): WeatherInfo => {
  const conditions = [
    { condition: "Sunny", icon: "☀️" },
    { condition: "Partly cloudy", icon: "⛅" },
    { condition: "Cloudy", icon: "☁️" },
    { condition: "Rainy", icon: "🌧️" },
    { condition: "Stormy", icon: "⛈️" }
  ];
  
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    temperature: Math.floor(Math.random() * 25) + 5, // 5-30°C
    condition: randomCondition.condition,
    icon: randomCondition.icon,
    humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
    wind: Math.floor(Math.random() * 30) + 5 // 5-35 km/h
  };
};

export const mockCO2Savings = (): CO2Savings => {
  // Mock calculation based on distance and average emissions
  const totalKg = parseFloat((Math.random() * 3 + 1).toFixed(2));
  const treesEquivalent = parseFloat((totalKg / 21 * 100).toFixed(1));
  
  return {
    totalKg,
    treesEquivalent
  };
};

// Function to calculate distance between two coordinates in meters
export const calculateDistance = (coord1: Location, coord2: Location): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lon - coord1.lon) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Mock function to get a simulated updated position along a route
let simulationCounter = 0;
export const getUpdatedLocation = (): Location => {
  simulationCounter++;
  
  // Start at the beginning coordinates
  const start = mockCurrentLocation();
  const end = mockDestination();
  
  // Calculate progress (0 to 1) based on simulation counter
  // Reset after 300 steps to loop the simulation
  const progress = (simulationCounter % 300) / 300;
  
  // Interpolate between start and end based on progress
  const newLat = start.lat + (end.lat - start.lat) * progress;
  const newLon = start.lon + (end.lon - start.lon) * progress;
  
  // Add some small random variation to make movement look more natural
  const jitter = 0.0005; // Degree of randomness
  const randomLat = (Math.random() - 0.5) * jitter;
  const randomLon = (Math.random() - 0.5) * jitter;
  
  return {
    lat: newLat + randomLat,
    lon: newLon + randomLon
  };
};
