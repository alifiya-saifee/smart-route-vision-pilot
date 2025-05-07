
export interface Location {
  lat: number;
  lon: number;
}

export interface Route {
  id: string;
  name: string;
  start: Location;
  end: Location;
  distance: number; // in kilometers
  duration: number; // in minutes
  instructions: RouteInstruction[];
}

export interface RouteInstruction {
  number: number;
  distance: number;
  duration: number;
  instruction: string;
  name: string;
  coordinate: [number, number]; // [lon, lat]
}

export interface DetectedObject {
  type: string;
  count: number;
}

export interface LaneOffset {
  value: number;
  direction: "Left" | "Center" | "Right" | "Unknown";
}

export type EmergencyLevel = "none" | "warning" | "critical";

export interface EmergencyStatus {
  active: boolean;
  level: EmergencyLevel;
  type: string | null;
  triggers: EmergencyTrigger[];
  duration: number;
  response?: string;
  action?: string;
  initiate_call?: boolean;
}

export interface EmergencyTrigger {
  type: string;
  level: EmergencyLevel;
  details: string;
}

export interface WeatherInfo {
  temperature: number; // in Celsius
  condition: string;
  icon: string;
  humidity: number; // percentage
  wind: number; // km/h
}

export interface CO2Savings {
  totalKg: number;
  treesEquivalent: number;
}

export interface NavigationState {
  isRouteSet: boolean;
  currentLocation: Location | null;
  destination: Location | null;
  route: Route | null;
  nextInstruction: RouteInstruction | null;
  distanceToNextInstruction: number;
  detectedObjects: DetectedObject[];
  laneOffset: LaneOffset;
  emergencyStatus: EmergencyStatus;
  weather: WeatherInfo | null;
  co2Savings: CO2Savings;
}
