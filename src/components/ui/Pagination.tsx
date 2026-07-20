import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}) => {
  const { t } = useTranslation();

  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-3 mt-2 border-t border-secondary-100">
      <div className="flex items-center gap-2 text-sm text-secondary-500">
        <span>{t('pagination.showing', { start, end, total })}</span>
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="ml-1 bg-white border border-secondary-300 rounded-md px-2 py-1 text-sm text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-md text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          aria-label={t('pagination.previous')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }

          const isActive = pageNum === page;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'min-w-[2rem] px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
              )}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-md text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          aria-label={t('pagination.next')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
