
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useEffect, useRef, useState } from "react"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const mountedRef = useRef(true)
  const toastIdMapRef = useRef(new Map<string, string>())
  const [, setRenderCounter] = useState(0)
  
  // Track component mount state to prevent updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    
    // Listen for clear-toasts events
    const handleClearToasts = () => {
      if (mountedRef.current && toasts && dismiss) {
        // Schedule toast dismissal with double RAF to ensure DOM is ready
        // This technique helps avoid React state/DOM inconsistency issues
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!mountedRef.current) return;
            
            // Clone the array to avoid mutation during iteration
            const toastIds = [...toasts].map(t => t.id).filter(Boolean);
            toastIds.forEach(id => {
              if (id) {
                try {
                  dismiss(id);
                } catch (err) {
                  console.error("Error dismissing toast:", err);
                }
              }
            });
          });
        });
      }
    };
    
    document.addEventListener('clear-toasts', handleClearToasts);
    
    // Force a re-render once after mounting to ensure proper initialization
    requestAnimationFrame(() => {
      if (mountedRef.current) {
        setRenderCounter(c => c + 1);
      }
    });
    
    return () => {
      mountedRef.current = false;
      document.removeEventListener('clear-toasts', handleClearToasts);
    }
  }, [dismiss]);

  // Generate stable keys for toasts to prevent React reconciliation issues
  useEffect(() => {
    // Update the stable ID map whenever toasts change
    if (!mountedRef.current) return;
    
    // Create unique keys for any new toasts
    toasts.forEach(toast => {
      if (toast.id && !toastIdMapRef.current.has(toast.id)) {
        toastIdMapRef.current.set(toast.id, `toast-${toast.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
      }
    });
    
    // Clean up old toast IDs that are no longer present
    const currentIds = new Set(toasts.map(t => t.id));
    toastIdMapRef.current.forEach((_, id) => {
      if (!currentIds.has(id)) {
        toastIdMapRef.current.delete(id);
      }
    });
  }, [toasts]);

  // Safely render toasts with stable keys
  const safeToasts = toasts.map(function ({ id, title, description, action, ...props }) {
    // Get stable key for this toast ID to prevent React reconciliation issues
    const stableKey = id ? toastIdMapRef.current.get(id) || `toast-${id}-${Date.now()}` : `toast-unknown-${Date.now()}`;
    
    return {
      key: stableKey,
      toast: { id, title, description, action, ...props }
    };
  });

  return (
    <ToastProvider>
      {safeToasts.map(({key, toast}) => {
        const { id, title, description, action, ...props } = toast;
        return (
          <Toast key={key} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
