
import React, { useEffect } from 'react';
import VideoFeed from '@/components/VideoFeed';
import NavigationPanel from '@/components/NavigationPanel';
import LanePositionIndicator from '@/components/LanePositionIndicator';
import ObjectDetection from '@/components/ObjectDetection';
import EmergencyAlert from '@/components/EmergencyAlert';
import WeatherAndEco from '@/components/WeatherAndEco';
import RouteControls from '@/components/RouteControls';
import RouteMap from '@/components/RouteMap';
import { clearToasts } from '@/components/ui/use-toast';

const Index = () => {
  // Clear any stale toasts on mount and unmount
  useEffect(() => {
    // Wait for component to fully mount before clearing toasts
    const timerId = setTimeout(() => {
      clearToasts();
    }, 100);
    
    return () => {
      clearTimeout(timerId);
      // Clear toasts on unmount to prevent state conflicts
      clearToasts();
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-center">Smart Route Vision Pilot</h1>
          <p className="text-center text-gray-400">AI-Powered Navigation and Safety System</p>
        </header>

        <EmergencyAlert />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Main video feed */}
          <div className="lg:col-span-8 h-[50vh] md:h-[60vh]">
            <VideoFeed className="w-full h-full" />
          </div>
          
          {/* Side panels */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <NavigationPanel />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              <LanePositionIndicator />
              <ObjectDetection />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="h-64">
            <RouteMap />
          </div>
          <WeatherAndEco />
        </div>

        <div className="navigation-panel flex items-center justify-center mb-6">
          <RouteControls />
        </div>
      </div>
    </div>
  );
};

export default Index;
