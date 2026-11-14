import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-xl',
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202033]/40 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`glass-modal bg-white border border-[#E4E3EF] rounded-2xl sm:rounded-3xl w-full ${maxWidth} max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-[#202033] shadow-2xl`}
      >
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-[#E4E3EF] bg-[#F8F8FC]/60">
          <div>
            <h3 id="modal-title" className="text-base sm:text-lg font-bold text-[#202033] tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#68677D] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="neu-icon-btn p-1.5 rounded-xl cursor-pointer -mr-1"
          >
            <X className="w-4 h-4 text-[#68677D]" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
