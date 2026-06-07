'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Toast as ToastType, ToastType as ToastVariant } from '@/types';

interface ToastContextType {
  toasts: ToastType[];
  addToast: (toast: Omit<ToastType, 'id'>) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastType, 'id'>) => {
      const id = `toast-${++toastCounter}-${Date.now()}`;
      const newToast: ToastType = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss
      const duration = toast.duration || 5000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const createToast = useCallback(
    (type: ToastVariant) => {
      return (title: string, message?: string) => {
        addToast({ type, title, message });
      };
    },
    [addToast]
  );

  const toast = React.useMemo(
    () => ({
      success: createToast('success'),
      error: createToast('error'),
      info: createToast('info'),
      warning: createToast('warning'),
    }),
    [createToast]
  );

  const contextValue = React.useMemo(
    () => ({ toasts, addToast, removeToast, toast }),
    [toasts, addToast, removeToast, toast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    // During SSR / static generation, return safe no-op defaults
    const noop = () => {};
    return {
      toasts: [],
      addToast: noop as ToastContextType['addToast'],
      removeToast: noop,
      toast: {
        success: noop,
        error: noop,
        info: noop,
        warning: noop,
      },
    };
  }
  return context;
}
