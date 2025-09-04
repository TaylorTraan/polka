import { useState, useCallback } from 'react';

/**
 * Hook for managing async operations with loading and error states
 * @param operation - The async operation to perform
 * @returns Object with execute function, loading state, error state, and reset function
 */
export function useAsyncOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: T): Promise<R | undefined> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation(...args);
      return result;
    } catch (err) {
      setError(err as string);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [operation]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    execute,
    loading,
    error,
    reset
  };
}
