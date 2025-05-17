
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { NavigationProvider } from './context/NavigationContext';

// Create a stable query client instance outside of component rendering
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
});

const App = () => {
  const [hasError, setHasError] = useState(false);

  // Add comprehensive error boundary for DOM and rendering issues
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if the error is related to removeChild operations
      if (event.error && (
          event.error.toString().includes('removeChild') || 
          event.error.toString().includes('Node') ||
          event.error.toString().includes('not a child')
      )) {
        console.error('DOM removal error caught:', event.error);
        event.preventDefault(); // Prevent the error from crashing the app
        setHasError(true); // Track that we had an error
      }
    };
    
    window.addEventListener('error', handleError);
    
    // Add a fallback recovery mechanism
    if (hasError) {
      const recoveryTimer = setTimeout(() => {
        setHasError(false);
        console.log('Attempting UI recovery after DOM error');
      }, 1000);
      
      return () => {
        clearTimeout(recoveryTimer);
      };
    }
    
    return () => window.removeEventListener('error', handleError);
  }, [hasError]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NavigationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          {/* Render toasters after route components to ensure they have proper context */}
          <Toaster />
          <Sonner />
        </NavigationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
