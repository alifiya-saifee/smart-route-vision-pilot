
import React from 'react';
import { useNavigation } from '@/context/NavigationContext';

interface WeatherAndEcoProps {
  className?: string;
}

const WeatherAndEco: React.FC<WeatherAndEcoProps> = ({ className }) => {
  const { navigationState } = useNavigation();
  const { weather, co2Savings } = navigationState;

  return (
    <div className={`navigation-panel ${className || ''}`}>
      <div className="grid grid-cols-2 gap-4">
        {/* Weather information */}
        <div>
          <h2 className="text-lg font-bold mb-2">Weather</h2>
          {weather ? (
            <div className="text-center">
              <div className="text-4xl mb-1">{weather.icon}</div>
              <p className="text-xl font-bold">{weather.temperature}°C</p>
              <p className="text-sm text-gray-300">{weather.condition}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div className="text-gray-300">
                  <p>Humidity</p>
                  <p className="font-medium text-white">{weather.humidity}%</p>
                </div>
                <div className="text-gray-300">
                  <p>Wind</p>
                  <p className="font-medium text-white">{weather.wind} km/h</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              <p>Weather data unavailable</p>
            </div>
          )}
        </div>
        
        {/* CO2 Savings information */}
        <div>
          <h2 className="text-lg font-bold mb-2">CO₂ Savings</h2>
          <div className="text-center">
            <div className="text-4xl mb-1">🌱</div>
            <p className="text-xl font-bold">{co2Savings.totalKg.toFixed(2)} kg</p>
            <p className="text-sm text-gray-300">CO₂ saved this trip</p>
            <div className="mt-2 text-sm">
              <p className="text-gray-300">Equivalent to</p>
              <p className="font-medium text-green-400">{co2Savings.treesEquivalent.toFixed(1)}% of a tree's yearly CO₂ absorption</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherAndEco;
