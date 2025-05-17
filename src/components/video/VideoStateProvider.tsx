
import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from 'react';

interface VideoStateContextType {
  isUpdatingVideo: boolean;
  setIsUpdatingVideo: (value: boolean) => void;
}

const VideoStateContext = createContext<VideoStateContextType | undefined>(undefined);

export const useVideoState = (): VideoStateContextType => {
  const context = useContext(VideoStateContext);
  if (context === undefined) {
    throw new Error('useVideoState must be used within a VideoStateProvider');
  }
  return context;
};

interface VideoStateProviderProps {
  children: ReactNode;
}

export const VideoStateProvider: React.FC<VideoStateProviderProps> = ({ children }) => {
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);
  const mountedRef = useRef(true);
  
  // Track whether component is mounted to prevent state updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Safe state setter that checks if component is still mounted
  const safeSetIsUpdatingVideo = (value: boolean) => {
    if (mountedRef.current) {
      setIsUpdatingVideo(value);
    }
  };

  return (
    <VideoStateContext.Provider value={{ 
      isUpdatingVideo, 
      setIsUpdatingVideo: safeSetIsUpdatingVideo
    }}>
      {children}
    </VideoStateContext.Provider>
  );
};
