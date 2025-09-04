import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  persistent?: boolean;
}

const ErrorBanner = React.forwardRef<HTMLDivElement, ErrorBannerProps>(
  ({ message, onDismiss, className, persistent = false }, ref) => {
    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "px-6 py-3 border-b border-border/30 bg-muted/30",
            "text-sm text-foreground/80",
            className
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-foreground/60 flex-shrink-0" />
            <span className="text-center">{message}</span>
            {onDismiss && !persistent && (
              <button
                onClick={onDismiss}
                className="ml-2 w-5 h-5 rounded-sm hover:bg-foreground/10 flex items-center justify-center transition-colors duration-150 flex-shrink-0"
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

ErrorBanner.displayName = "ErrorBanner";

export { ErrorBanner };
