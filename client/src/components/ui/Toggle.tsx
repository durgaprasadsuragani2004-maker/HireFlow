import React from 'react';
import { cn } from '../../lib/utils';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 select-none cursor-pointer',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!disabled) onChange(!checked);
          }
        }}
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
        className={cn(
          'neu-toggle-track focus-ring shrink-0',
          checked && 'checked'
        )}
      >
        <div className="neu-toggle-thumb" />
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs font-semibold text-[#202033]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-[#68677D]">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};
