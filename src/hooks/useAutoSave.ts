import { useCallback, useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
  /** Delay in milliseconds before saving (default: 1000ms) */
  delay?: number;
  /** Whether to save immediately when the component unmounts */
  saveOnUnmount?: boolean;
  /** Whether to save immediately when the page/tab becomes hidden */
  saveOnPageHide?: boolean;
}

/**
 * Hook for implementing efficient autosave with debouncing
 * @param saveFunction - Function to call when saving
 * @param data - Data to save
 * @param options - Configuration options
 * @returns Object with save controls and status
 */
export function useAutoSave<T>(
  saveFunction: (data: T) => Promise<void> | void,
  data: T,
  options: UseAutoSaveOptions = {}
) {
  const {
    delay = 1000,
    saveOnUnmount = true,
    saveOnPageHide = true
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  // Clear any existing timeout
  const clearSaveTimeout = useCallback(() => {
    if (timeoutRef.current) {
      globalThis.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Perform the actual save operation
  const performSave = useCallback(async (dataToSave: T) => {
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    try {
      isSavingRef.current = true;
      await saveFunction(dataToSave);
      lastSavedDataRef.current = dataToSave;
      
      // If there was a pending save request, perform it now
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        // Use setTimeout to avoid blocking the UI
        setTimeout(() => performSave(data), 0);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Could emit an event or call an error handler here
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFunction, data]);

  // Debounced save function
  const debouncedSave = useCallback((dataToSave: T) => {
    // Don't save if data hasn't changed
    if (JSON.stringify(dataToSave) === JSON.stringify(lastSavedDataRef.current)) {
      return;
    }

    clearSaveTimeout();
    timeoutRef.current = globalThis.setTimeout(() => {
      performSave(dataToSave);
    }, delay);
  }, [delay, clearSaveTimeout, performSave]);

  // Immediate save function (bypasses debouncing)
  const saveImmediately = useCallback(() => {
    clearSaveTimeout();
    performSave(data);
  }, [clearSaveTimeout, performSave, data]);

  // Effect to trigger debounced save when data changes
  useEffect(() => {
    debouncedSave(data);
  }, [data, debouncedSave]);

  // Save on component unmount
  useEffect(() => {
    if (!saveOnUnmount) return;

    return () => {
      // Save immediately on unmount if there are unsaved changes
      if (JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current)) {
        // Use synchronous save for unmount
        try {
          const result = saveFunction(data);
          if (result instanceof Promise) {
            // For async saves on unmount, we can't wait, but we try
            result.catch(console.error);
          }
        } catch (error) {
          console.error('Failed to save on unmount:', error);
        }
      }
    };
  }, [data, saveFunction, saveOnUnmount]);

  // Save when page becomes hidden (user switches tabs, etc.)
  useEffect(() => {
    if (!saveOnPageHide) return;

    const handleVisibilityChange = () => {
      if (document.hidden && JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current)) {
        saveImmediately();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [data, saveImmediately, saveOnPageHide]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return clearSaveTimeout;
  }, [clearSaveTimeout]);

  return {
    /** Trigger an immediate save (bypasses debouncing) */
    saveImmediately,
    /** Whether a save operation is currently in progress */
    isSaving: isSavingRef.current,
    /** Whether there are unsaved changes */
    hasUnsavedChanges: JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current)
  };
}
