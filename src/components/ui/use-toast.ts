
import { useToast, toast } from "@/hooks/use-toast";

// Add safety wrapper to prevent removeChild errors
const safeToast = (props: Parameters<typeof toast>[0]) => {
  try {
    // Use double requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          // Check if document is still available (not during unmounting)
          if (typeof document !== 'undefined' && document.body) {
            toast(props);
          }
        } catch (error) {
          console.error("Error showing toast:", error);
        }
      });
    });
  } catch (error) {
    console.error("Error in toast wrapper:", error);
  }
};

// Create a safer version of clearToasts that doesn't rely on hooks outside components
const clearToasts = () => {
  try {
    // Instead of trying to use hooks outside of components, dispatch a custom event
    // that components can listen for
    if (typeof document !== 'undefined') {
      // Add timeout to ensure we're not in the middle of a React render cycle
      setTimeout(() => {
        try {
          const clearEvent = new CustomEvent('clear-toasts');
          document.dispatchEvent(clearEvent);
        } catch (error) {
          console.error("Error dispatching clear-toasts event:", error);
        }
      }, 50);
    }
  } catch (error) {
    console.error("Error in clearToasts:", error);
  }
};

export { useToast, toast, safeToast, clearToasts };
