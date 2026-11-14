import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  const renderPages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn('inline-flex items-center gap-1.5 p-1 bg-[#F0F1F8] border border-[#E4E3EF] rounded-2xl shadow-sm', className)}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous Page"
        className="neu-icon-btn p-1.5 rounded-xl disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4 text-[#202033]" />
      </button>

      <div className="flex items-center gap-1">
        {renderPages().map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`dots-${idx}`} className="px-2 text-xs text-[#68677D]">
                ...
              </span>
            );
          }

          const pageNum = Number(page);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'min-w-[32px] h-8 px-2 text-xs font-bold rounded-xl transition-all duration-150 select-none cursor-pointer focus-ring',
                isActive
                  ? 'neu-btn-primary text-white shadow-neu-primary border border-white/20'
                  : 'text-[#68677D] hover:text-[#6C5CE7] hover:bg-white'
              )}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next Page"
        className="neu-icon-btn p-1.5 rounded-xl disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronRight className="w-4 h-4 text-[#202033]" />
      </button>
    </nav>
  );
};

