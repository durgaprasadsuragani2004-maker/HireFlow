import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  dot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    default:
      'bg-[#1E293B] text-[#A1AEC2] border-[#2B3950]',
    primary:
      'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    success:
      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning:
      'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger:
      'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info:
      'bg-sky-500/15 text-sky-300 border-sky-500/30',
    purple:
      'bg-violet-500/15 text-violet-300 border-violet-500/30',
    outline:
      'border border-[#2B3950] text-[#A1AEC2] bg-[#151F32]/60',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    purple: 'bg-violet-500',
    outline: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors leading-normal',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};
