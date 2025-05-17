
import { useToast, toast } from "@/hooks/use-toast";

// Add safety wrapper to prevent removeChild errors
const safeToast = (props: Parameters<typeof toast>[0]) => {
  try {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      try {
        toast(props);
      } catch (error) {
        console.error("Error showing toast:", error);
      }
    });
  } catch (error) {
    console.error("Error in toast wrapper:", error);
  }
};

export { useToast, toast, safeToast };
