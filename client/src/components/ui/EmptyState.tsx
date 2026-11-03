import React from 'react';
import { FolderSearch } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#2B3950] rounded-2xl sm:rounded-3xl bg-[#151F32]/50 my-4 sm:my-6">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 shadow-subtle border border-indigo-500/20">
        {icon || <FolderSearch className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-[#F1F5F9] mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-[#A1AEC2] max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
