'use client';

import { useState, useCallback } from 'react';

interface UseErrorHandlerOptions {
  onError?: (error: Error) => void;
  showToast?: boolean;
}

interface ErrorHandlerResult {
  error: Error | null;
  isLoading: boolean;
  execute: <T>(fn: () => Promise<T>) => Promise<T | null>;
  clearError: () => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): ErrorHandlerResult {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
      
      if (options.showToast) {
        console.error('Operation failed:', error.message);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, isLoading, execute, clearError };
}

// Toast notification hook
interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showSuccess = useCallback((message: string) => {
    setToast({ message, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const showError = useCallback((message: string) => {
    setToast({ message, type: 'error' });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const showInfo = useCallback((message: string) => {
    setToast({ message, type: 'info' });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showSuccess, showError, showInfo, hideToast };
}
