
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';

interface EmergencyAlertProps {
  className?: string;
}

const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ className }) => {
  const { navigationState } = useNavigation();
  const { emergencyStatus } = navigationState;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Handle mount/unmount gracefully to avoid React reconciliation issues
    if (emergencyStatus.active) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // Small delay before hiding to allow for smooth transitions
      const timer = setTimeout(() => {
        setVisible(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [emergencyStatus.active]);

  if (!visible) return null;

  const alertClass = emergencyStatus.level === 'critical' 
    ? 'bg-red-600/90 text-white p-4 rounded-lg shadow-lg animate-pulse' 
    : 'bg-yellow-500/90 text-white p-4 rounded-lg shadow-lg';

  return (
    <div className={`fixed inset-x-0 mx-auto max-w-screen-lg z-50 px-4 ${className || ''}`} style={{ top: '2rem' }}>
      <div className={`${alertClass} flex items-center justify-between`}>
        <div className="flex items-center">
          <div className="mr-3 text-2xl">
            {emergencyStatus.level === 'critical' ? '⚠️' : '⚠️'}
          </div>
          <div>
            <p className="font-bold">
              {emergencyStatus.response || `${emergencyStatus.level.toUpperCase()} ALERT`}
            </p>
            {emergencyStatus.type && (
              <p className="text-sm opacity-90">{emergencyStatus.type.replace('_', ' ')}</p>
            )}
          </div>
        </div>
        
        {emergencyStatus.level === 'critical' && emergencyStatus.initiate_call && (
          <div className="flex items-center bg-white/20 px-3 py-1 rounded-md animate-pulse">
            <span className="mr-2">📞</span>
            <span className="font-bold">Emergency Services</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyAlert;
