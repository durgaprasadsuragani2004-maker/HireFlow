'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((rawMessage: string, type: ToastType = 'info') => {
    let message = rawMessage;
    if (!message || typeof message !== 'string') {
      message = 'An unexpected error occurred. Please try again.';
    } else if (
      message.toLowerCase().includes('internal server error') ||
      message.toLowerCase().includes('prisma') ||
      message.toLowerCase().includes('eaddrinuse')
    ) {
      message = 'Unable to complete request. Please try again momentarily.';
    }

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toastContainer = (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 999999,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '0.625rem',
        maxWidth: '24rem',
        width: '100%',
      }}
      aria-live="polite"
      id="hireflow-toast-portal-container"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{ pointerEvents: 'auto' }}
          className={`glass-toast bg-white flex items-start justify-between gap-3 p-4 shadow-xl border backdrop-blur-xl transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in text-[#202033] ${
            toast.type === 'success'
              ? 'border-[#16A878]/40 shadow-[0_8px_24px_rgba(22,168,120,0.15)]'
              : toast.type === 'error'
              ? 'border-[#E05260]/40 shadow-[0_8px_24px_rgba(224,82,96,0.15)]'
              : toast.type === 'warning'
              ? 'border-[#E9A23B]/40 shadow-[0_8px_24px_rgba(233,162,59,0.15)]'
              : 'border-[#8B7CF6]/40 shadow-[0_8px_24px_rgba(108,92,231,0.15)]'
          }`}
        >
          <div className="flex items-start gap-3 text-xs font-medium leading-relaxed">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#16A878] shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#E05260] shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-[#E9A23B] shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />}
            <span className="break-words">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="neu-icon-btn p-1 -mr-1 -mt-0.5 rounded-lg text-[#68677D] hover:text-[#202033] transition-colors shrink-0 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted && createPortal(toastContainer, document.body)}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
