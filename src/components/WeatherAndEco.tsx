
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigation } from '@/context/NavigationContext';
import { AlertCircle } from 'lucide-react';

interface WeatherApiResponse {
  temperature: number;
  condition: string;
  humidity: number;
  wind: number;
  icon: string;
}

const WeatherAndEco: React.FC = () => {
  const { navigationState, updateCO2Savings } = useNavigation();
  const { currentLocation, co2Savings, weather } = navigationState;
  const [loading, setLoading] = useState(false);
  
  // Fetch weather data when location changes
  useEffect(() => {
    if (!currentLocation) return;
    
    const fetchWeather = async () => {
      setLoading(true);
      try {
        // In a real app, this would call a weather API
        // This is a mock implementation
        console.log("Fetching weather for:", currentLocation);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create mock weather data based on coordinates (for demonstration)
        const mockWeather: WeatherApiResponse = {
          temperature: 15 + Math.round(Math.random() * 15),
          condition: ["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Stormy"][Math.floor(Math.random() * 5)],
          humidity: 40 + Math.round(Math.random() * 40),
          wind: 5 + Math.round(Math.random() * 15),
          icon: ["01d", "02d", "03d", "09d", "11d"][Math.floor(Math.random() * 5)]
        };
        
        // Pass weather data to navigation context
        updateWeatherInfo(mockWeather);
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
  }, [currentLocation]);
  
  // Simulate updating weather in navigation context
  const updateWeatherInfo = (weatherData: WeatherApiResponse) => {
    // This would be a real function in your navigation context
    console.log("Weather updated:", weatherData);
  };
  
  // Get weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'sunny':
        return '☀️';
      case 'partly cloudy':
        return '⛅';
      case 'cloudy':
        return '☁️';
      case 'rainy':
        return '🌧️';
      case 'stormy':
        return '⛈️';
      default:
        return '🌤️';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            {weather?.icon ? (
              <span className="text-xl mr-2">{getWeatherIcon(weather.condition)}</span>
            ) : (
              <AlertCircle className="mr-2 h-5 w-5 text-yellow-400" />
            )}
            Weather Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : !currentLocation ? (
            <div className="text-center text-gray-400 py-6">
              Set your location to view weather data
            </div>
          ) : weather ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-3xl font-bold text-white">{weather.temperature}°C</div>
                <div className="text-sm text-gray-300">{weather.condition}</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Humidity:</span>
                  <span className="text-white">{weather.humidity}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Wind:</span>
                  <span className="text-white">{weather.wind} km/h</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-6">
              Weather data unavailable
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <span className="text-xl mr-2">🌱</span>
            Eco Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-2">
            <div className="text-2xl font-bold text-green-400">{co2Savings.totalKg.toFixed(1)} kg</div>
            <div className="text-sm text-gray-300">CO₂ Emissions Saved</div>
          </div>
          
          <div className="mt-3 flex items-center justify-center">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${Math.min(co2Savings.treesEquivalent * 10, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-2 text-center text-sm text-gray-300">
            Equivalent to {co2Savings.treesEquivalent.toFixed(1)} trees planted
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherAndEco;
