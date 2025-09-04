import { useState, useCallback } from 'react';

/**
 * Hook for managing confirmation dialog state
 * @returns Object with dialog state and control functions
 */
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
  }, []);

  const executeWithLoading = useCallback(async (operation: () => void | Promise<void>) => {
    setIsLoading(true);
    try {
      const result = operation();
      if (result instanceof Promise) {
        await result;
      }
      close();
    } finally {
      setIsLoading(false);
    }
  }, [close]);

  return {
    isOpen,
    isLoading,
    open,
    close,
    executeWithLoading
  };
}
