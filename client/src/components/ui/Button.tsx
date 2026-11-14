import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl select-none transition-all duration-150 focus-ring disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none cursor-pointer';

  const variants = {
    primary:
      'neu-btn-primary',
    secondary:
      'neu-btn-secondary',
    outline:
      'bg-white text-[#202033] border border-[#E4E3EF] shadow-neu-raised hover:border-[#8B7CF6] hover:text-[#6C5CE7] hover:bg-[#F8F8FC] active:shadow-neu-pressed active:translate-y-[1px]',
    danger:
      'neu-btn-danger',
    ghost:
      'text-[#68677D] hover:text-[#202033] hover:bg-[#F0F1F8] active:bg-[#EAE7FF] active:scale-[0.98]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-4 py-2 gap-2 h-9 sm:h-10',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5 h-11',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0 -ml-0.5" />}
      {children}
    </button>
  );
};
