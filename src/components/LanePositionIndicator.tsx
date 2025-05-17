
import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';

const LanePositionIndicator: React.FC = () => {
  const { navigationState } = useNavigation();
  const { laneOffset } = navigationState;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw lane indicator on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate offset (scale offset to fit indicator)
    const maxOffset = 50; // max offset value from laneOffset
    const offsetPercentage = Math.min(Math.abs(laneOffset.value) / maxOffset, 1);
    const direction = laneOffset.value < 0 ? -1 : 1; // -1 for left, 1 for right
    
    // Draw road
    ctx.fillStyle = '#333';
    ctx.fillRect(width * 0.1, height * 0.4, width * 0.8, height * 0.2);
    
    // Draw center line (dashed)
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(width / 2, height * 0.4);
    ctx.lineTo(width / 2, height * 0.6);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw car indicator
    const carWidth = width * 0.12;
    const carHeight = height * 0.25;
    
    // Position car based on offset
    const centerX = width / 2;
    const offsetX = direction * offsetPercentage * (width * 0.3); // Max car movement
    const carX = centerX + offsetX - carWidth / 2;
    const carY = height * 0.65;
    
    // Draw car body
    ctx.fillStyle = '#3b82f6'; // Blue color
    ctx.fillRect(carX, carY, carWidth, carHeight);
    
    // Draw car roof
    ctx.beginPath();
    ctx.moveTo(carX + carWidth * 0.2, carY);
    ctx.lineTo(carX + carWidth * 0.3, carY - carHeight * 0.3);
    ctx.lineTo(carX + carWidth * 0.7, carY - carHeight * 0.3);
    ctx.lineTo(carX + carWidth * 0.8, carY);
    ctx.closePath();
    ctx.fillStyle = '#2563eb'; // Darker blue
    ctx.fill();
    
    // Draw wheels
    ctx.fillStyle = '#000';
    ctx.fillRect(carX - carWidth * 0.05, carY + carHeight * 0.75, carWidth * 0.2, carHeight * 0.25);
    ctx.fillRect(carX + carWidth * 0.85, carY + carHeight * 0.75, carWidth * 0.2, carHeight * 0.25);
    
    // Draw warning icon if offset is significant
    if (Math.abs(laneOffset.value) > 25) {
      ctx.fillStyle = '#ef4444'; // Red color
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.2, width * 0.05, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw exclamation mark
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${width * 0.05}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', width / 2, height * 0.2);
    }
  }, [laneOffset]);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl mr-2">🛣️</span>
            Lane Position
          </div>
          {Math.abs(laneOffset.value) > 25 && (
            <div className="flex items-center text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Lane Departure
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-32">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full" 
          />
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-3 text-xs text-gray-400">
            <div className="flex items-center">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Left
            </div>
            <div className="flex items-center">
              Right
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-between items-center">
          <div className="text-sm">
            <span className="text-gray-400">Position: </span>
            <span className={
              Math.abs(laneOffset.value) < 10 
                ? "text-green-400" 
                : Math.abs(laneOffset.value) < 25
                  ? "text-yellow-400"
                  : "text-red-400"
            }>
              {laneOffset.direction}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Offset: </span>
            <span className={
              Math.abs(laneOffset.value) < 10 
                ? "text-green-400" 
                : Math.abs(laneOffset.value) < 25
                  ? "text-yellow-400"
                  : "text-red-400"
            }>
              {Math.abs(laneOffset.value).toFixed(1)}px
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanePositionIndicator;
