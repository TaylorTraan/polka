import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  variant?: "inline" | "banner" | "toast";
  className?: string;
  showIcon?: boolean;
}

const ErrorMessage = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ message, onDismiss, variant = "inline", className, showIcon = true }, ref) => {
    const baseClasses = "text-sm transition-all duration-200";
    
    const variantClasses = {
      inline: "p-3 rounded-md border",
      banner: "px-6 py-3 border-b",
      toast: "p-3 rounded-lg border shadow-sm"
    };

    const colorClasses = "bg-muted/50 border-border/50 text-foreground/80 hover:bg-muted/70";

    const iconClasses = "w-4 h-4 text-foreground/60 flex-shrink-0";

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            baseClasses,
            variantClasses[variant],
            colorClasses,
            className
          )}
        >
          <div className="flex items-start gap-2">
            {showIcon && (
              <AlertCircle className={iconClasses} />
            )}
            <span className="flex-1 leading-relaxed">{message}</span>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-5 h-5 rounded-sm hover:bg-foreground/10 flex items-center justify-center transition-colors duration-150 flex-shrink-0"
                aria-label="Dismiss error"
              >
                <X className="w-3 h-3 text-foreground/60" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

ErrorMessage.displayName = "ErrorMessage";

export { ErrorMessage };
