
import { useRef, useCallback, useEffect } from 'react';

export const useSafeOperations = () => {
  const isMountedRef = useRef<boolean>(true);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  
  // Helper to register cleanup functions
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.push(cleanupFn);
  }, []);
  
  // Run all registered cleanup functions on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      // First, signal that component is unmounting
      isMountedRef.current = false;
      
      // Execute all registered cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (err) {
          console.error("Cleanup error:", err);
        }
      });
      
      // Clear the cleanup functions array
      cleanupFunctionsRef.current = [];
    };
  }, []);
  
  // Create a safe debounced function handler
  const createSafeHandler = useCallback((handler: Function, waitTime = 500) => {
    let timerId: NodeJS.Timeout | null = null;
    let isRunning = false;
    
    return (...args: any[]) => {
      if (!isMountedRef.current || isRunning) return;
      
      isRunning = true;
      
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      
      timerId = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        try {
          handler(...args);
        } catch (error) {
          console.error("Handler error:", error);
        } finally {
          isRunning = false;
          timerId = null;
        }
      }, waitTime) as unknown as NodeJS.Timeout;
      
      // Register cleanup for this timeout
      registerCleanup(() => {
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
      });
    };
  }, [registerCleanup]);
  
  return {
    isMounted: isMountedRef,
    registerCleanup,
    createSafeHandler
  };
};
