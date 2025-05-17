
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useEffect, useRef } from "react"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const mountedRef = useRef(true)
  
  // Track component mount state to prevent updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    
    // Listen for clear-toasts events
    const handleClearToasts = () => {
      if (mountedRef.current && toasts && dismiss) {
        toasts.forEach(t => {
          if (t.id) dismiss(t.id);
        });
      }
    };
    
    document.addEventListener('clear-toasts', handleClearToasts);
    
    return () => {
      mountedRef.current = false;
      document.removeEventListener('clear-toasts', handleClearToasts);
    }
  }, [toasts, dismiss]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Each toast should have a unique key to prevent React reconciliation issues
        const toastKey = `toast-${id}-${Date.now()}`
        
        return (
          <Toast key={toastKey} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
