import React, { ReactNode } from 'react';
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
}

function Table<T = any>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  className,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={cn('card', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-secondary-200 rounded w-full mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-secondary-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-secondary-200">
        <thead className="bg-secondary-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-secondary-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-secondary-50 transition-colors duration-150"
              >
                {columns.map((column) => {
                  const value = (row as any)[column.key];
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'px-6 py-4 whitespace-nowrap text-sm text-secondary-900',
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