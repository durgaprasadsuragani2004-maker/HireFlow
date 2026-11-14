import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
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
      'bg-[#F0F1F8] text-[#68677D] border-[#E4E3EF]',
    primary:
      'bg-[#EAE7FF] text-[#6C5CE7] border-[#8B7CF6]/35 shadow-[0_1px_4px_rgba(108,92,231,0.12)] font-semibold',
    success:
      'bg-[#16A878]/12 text-[#16A878] border-[#16A878]/30 font-semibold',
    warning:
      'bg-[#E9A23B]/12 text-[#C47D15] border-[#E9A23B]/30 font-semibold',
    danger:
      'bg-[#E05260]/12 text-[#E05260] border-[#E05260]/30 font-semibold',
    info:
      'bg-[#EAE7FF] text-[#6C5CE7] border-[#8B7CF6]/30 font-semibold',
    purple:
      'bg-[#EAE7FF] text-[#6C5CE7] border-[#8B7CF6]/35 shadow-[0_1px_4px_rgba(108,92,231,0.12)] font-semibold',
    outline:
      'border border-[#E4E3EF] text-[#68677D] bg-white',
  };

  const dotColors = {
    default: 'bg-[#9E9EB3]',
    primary: 'bg-[#6C5CE7]',
    success: 'bg-[#16A878]',
    warning: 'bg-[#E9A23B]',
    danger: 'bg-[#E05260]',
    info: 'bg-[#6C5CE7]',
    purple: 'bg-[#6C5CE7]',
    outline: 'bg-[#9E9EB3]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all duration-150 leading-normal select-none',
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
