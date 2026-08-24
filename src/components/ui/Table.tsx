import React, { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Column<T = any> {
  key: string;
  header: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface TableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

function Table<T = any>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  className,
  sortBy,
  sortOrder,
  onSort,
}: TableProps<T>) {
  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    const newOrder =
      sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newOrder);
  };

  if (loading) {
    return (
      <div className={cn('card', className)}>
        <div className="animate-pulse">
          <div className="h-4 gd-skel w-full mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 gd-skel w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="gd-table min-w-full">
        <thead>
          <tr className="border-b border-secondary-200">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'text-left',
                  column.sortable && onSort &&
                    'cursor-pointer select-none transition-colors hover:text-secondary-700',
                  column.className
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-1.5">
                  <span>{column.header}</span>
                  {column.sortable && onSort && (
                    <span className="inline-flex">
                      {sortBy === column.key ? (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5 text-primary-600" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-primary-600" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 text-secondary-300" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-14 text-center text-sm text-secondary-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                
              >
                {columns.map((column) => {
                  const value = (row as any)[column.key];
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'whitespace-nowrap',
                        column.className
                      )}
                    >
                      {column.render ? column.render(value, row) : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
