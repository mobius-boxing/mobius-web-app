import React, { Fragment, ReactNode, useId } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { Column } from './Table';

export interface CardListProps<T = any> {
  data: T[];
  /** Visible columns in effective order — the same array `Table` would pass to `<table>` (I-12). */
  columns: Column<T>[];
  emptyMessage: string;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  renderExpanded?: (row: T, index: number) => ReactNode;
  /** Two-column grid at >= 640px of container width. Computed once by `Table` (D-40) rather than a second observer here. */
  twoUp?: boolean;
}

const regionOf = <T,>(column: Column<T>): 'title' | 'field' | 'actions' => column.card ?? 'field';

function CardList<T = any>({
  data,
  columns,
  emptyMessage,
  sortBy,
  sortOrder,
  onSort,
  renderExpanded,
  twoUp = false,
}: CardListProps<T>) {
  const { t } = useTranslation();
  const sortSelectId = useId();

  const titleColumns = columns.filter((c) => regionOf(c) === 'title');
  const fieldColumns = columns.filter((c) => regionOf(c) === 'field');
  const actionColumns = columns.filter((c) => regionOf(c) === 'actions');
  const headColumns = titleColumns.length > 0 ? titleColumns : columns.slice(0, 1);

  const sortableColumns = columns.filter((c) => c.sortable);
  const showSort = Boolean(onSort) && sortableColumns.length > 0;

  const handleSelectSort = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const key = event.target.value;
    // The blank "default order" option has no equivalent `onSort` call — Table
    // exposes no "clear sort" callback, so it is a placeholder, not an action.
    if (!key || !onSort) return;
    const nextOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(key, nextOrder);
  };

  const toggleDirection = () => {
    if (!sortBy || !onSort) return;
    onSort(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const renderCell = (column: Column<T>, row: T) => {
    const value = (row as any)[column.key];
    return column.render ? column.render(value, row) : value;
  };

  if (data.length === 0) {
    return <p className="px-6 py-14 text-center text-sm text-secondary-500">{emptyMessage}</p>;
  }

  return (
    <div>
      {showSort && (
        <div className="flex items-center gap-2 px-1 pb-3 text-sm text-secondary-600">
          <label htmlFor={sortSelectId} className="text-secondary-500">
            {t('table.sortBy')}
          </label>
          <select
            id={sortSelectId}
            value={sortBy ?? ''}
            onChange={handleSelectSort}
            className="bg-white border border-secondary-300 rounded-md px-2 py-1 text-sm text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          >
            <option value="">{t('table.sortNone')}</option>
            {sortableColumns.map((column) => (
              <option key={column.key} value={column.key}>
                {column.label ?? column.header}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleDirection}
            disabled={!sortBy}
            aria-label={t(sortOrder === 'desc' ? 'table.sortDescending' : 'table.sortAscending')}
            className="p-1.5 rounded-md text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      )}

      <ul className={cn('gd-cards', twoUp && 'gd-cards-2up')}>
        {data.map((row, rowIndex) => {
          const expanded = renderExpanded?.(row, rowIndex);

          return (
            <li key={rowIndex} className="gd-card">
              <div className="gd-card__head">
                {headColumns.map((column) => (
                  <div key={column.key} className={column.className}>
                    {renderCell(column, row)}
                  </div>
                ))}
              </div>

              {fieldColumns.length > 0 && (
                <dl className="gd-card__fields">
                  {fieldColumns.map((column) => (
                    <Fragment key={column.key}>
                      <dt>{column.header}</dt>
                      <dd className={column.className}>{renderCell(column, row)}</dd>
                    </Fragment>
                  ))}
                </dl>
              )}

              {expanded ? <div className="gd-card__expanded">{expanded}</div> : null}

              {actionColumns.length > 0 && (
                <div className="gd-card__actions">
                  {actionColumns.map((column) => (
                    <div key={column.key} className={column.className}>
                      {renderCell(column, row)}
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default CardList;
