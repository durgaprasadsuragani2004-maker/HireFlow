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
        gap: '0.5rem',
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
          className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl shadow-dropdown border backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in ${
            toast.type === 'success'
              ? 'bg-[#1C2940]/95 border-emerald-500/50 text-[#F1F5F9] shadow-emerald-950/30'
              : toast.type === 'error'
              ? 'bg-[#1C2940]/95 border-rose-500/50 text-[#F1F5F9] shadow-rose-950/30'
              : toast.type === 'warning'
              ? 'bg-[#1C2940]/95 border-amber-500/50 text-[#F1F5F9] shadow-amber-950/30'
              : 'bg-[#1C2940]/95 border-indigo-500/50 text-[#F1F5F9] shadow-indigo-950/30'
          }`}
        >
          <div className="flex items-start gap-2.5 text-xs font-medium leading-relaxed">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
            <span className="break-words">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 -mr-1 -mt-0.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0"
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

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
