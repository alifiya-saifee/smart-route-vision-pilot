
import { useToast, toast } from "@/hooks/use-toast";

// Add safety wrapper to prevent removeChild errors
const safeToast = (props: Parameters<typeof toast>[0]) => {
  try {
    // Use requestAnimationFrame to ensure DOM is ready
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
  } catch (error) {
    console.error("Error in toast wrapper:", error);
  }
};

// Add a function to clear all toasts safely
const clearToasts = () => {
  try {
    requestAnimationFrame(() => {
      try {
        // Get the toast context and clear all toasts
        const { toasts, dismiss } = useToast.getState();
        if (toasts && dismiss) {
          toasts.forEach(t => {
            if (t.id) dismiss(t.id);
          });
        }
      } catch (error) {
        console.error("Error clearing toasts:", error);
      }
    });
  } catch (error) {
    console.error("Error in clearToasts:", error);
  }
};

export { useToast, toast, safeToast, clearToasts };
