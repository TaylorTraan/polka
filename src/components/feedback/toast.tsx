import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string;
  type?: "error" | "success" | "info" | "warning";
  onDismiss?: () => void;
  duration?: number;
  className?: string;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ message, type = "error", onDismiss, duration = 5000, className }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onDismiss?.(), 200); // Wait for exit animation
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, onDismiss]);

    const handleDismiss = () => {
      setIsVisible(false);
      setTimeout(() => onDismiss?.(), 200);
    };

    const iconMap = {
      error: AlertCircle,
      success: CheckCircle,
      info: Info,
      warning: AlertTriangle,
    };

    const Icon = iconMap[type];

    const typeClasses = {
      error: "bg-muted/90 border-border/50 text-foreground/90",
      success: "bg-muted/90 border-border/50 text-foreground/90",
      info: "bg-muted/90 border-border/50 text-foreground/90",
      warning: "bg-muted/90 border-border/50 text-foreground/90",
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "fixed top-4 right-4 z-50 p-3 rounded-lg border shadow-lg backdrop-blur-sm",
              "max-w-sm w-full mx-4",
              typeClasses[type],
              className
            )}
          >
            <div className="flex items-start gap-2">
              <Icon className="w-4 h-4 text-foreground/70 flex-shrink-0 mt-0.5" />
              <span className="flex-1 text-sm leading-relaxed">{message}</span>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="w-5 h-5 rounded-sm hover:bg-foreground/10 flex items-center justify-center transition-colors duration-150 flex-shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3 h-3 text-foreground/60" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

Toast.displayName = "Toast";

export { Toast };
