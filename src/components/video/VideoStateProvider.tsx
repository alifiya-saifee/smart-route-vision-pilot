
import React, { createContext, useState, useContext, ReactNode } from 'react';

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

  return (
    <VideoStateContext.Provider value={{ isUpdatingVideo, setIsUpdatingVideo }}>
      {children}
    </VideoStateContext.Provider>
  );
};
