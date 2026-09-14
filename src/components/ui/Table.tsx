import React, { ReactNode, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, GripVertical } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useColumnPreferences } from '../../hooks/useColumnPreferences';
import { useDragReorder } from '../../hooks/useDragReorder';
import { useElementWidth } from '../../hooks/useElementWidth';
import { useWheelHorizontalScroll } from '../../hooks/useWheelHorizontalScroll';
import CardList from './CardList';
import { ColumnChooserButton } from './ColumnChooser';

export interface Column<T = any> {
  key: string;
  header: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  /** Default true. false: always visible, still reorderable (the identifying column). */
  hideable?: boolean;
  /** Fixed at its code index and always visible (bulk-select, row actions). */
  pinned?: boolean;
  /** Hidden in the code defaults: no saved preference, or after a reset. */
  defaultHidden?: boolean;
  /** Region in the card layout. Default 'field'. */
  card?: 'title' | 'field' | 'actions';
  /** Column chooser text when `header` is empty. */
  label?: string;
}

export interface TableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  /**
   * Optional detail region for one row, rendered as a full-width `<tr>`
   * directly beneath it. Return a falsy value (the default) and the table is
   * exactly what it was: purely additive, no existing call site changes.
   *
   * Every `<td>` here is `whitespace-nowrap`, so a wide detail — a diff table,
   * a note — cannot live inside a data cell without being squeezed into one
   * column's width. It has to be its own spanning row.
   */
  renderExpanded?: (row: T, index: number) => ReactNode;
  /**
   * Stable per-list id (see the registry in model.md). Present: column
   * chooser + persistence + card view are all live. Absent: exactly today's
   * `Table`, no tools row, no card view — every unmigrated call site is
   * unaffected by this feature.
   */
  listId?: string;
}

/** Below this measured container width, `Table` renders `CardList` instead of `<table>` (A-5). */
export const CARD_BREAKPOINT_PX = 768;
/** `CardList`'s own two-column threshold, shared here since `Table` already measures the container (D-40). */
const CARD_TWO_UP_PX = 640;

function Table<T = any>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  className,
  sortBy,
  sortOrder,
  onSort,
  renderExpanded,
  listId,
}: TableProps<T>) {
  const prefs = useColumnPreferences(listId, columns);
  const effectiveColumns = prefs.columns;
  const pinnedKeys = new Set(effectiveColumns.filter((c) => c.pinned).map((c) => c.key));
  const dnd = useDragReorder({
    onDrop: prefs.moveTo,
    canDrag: (key) => !pinnedKeys.has(key),
    canDrop: (key) => !pinnedKeys.has(key),
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(wrapperRef);
  const showCards = listId !== undefined && width !== null && width < CARD_BREAKPOINT_PX;

  // A callback ref, not useRef: the scroller unmounts while loading and in card
  // mode, and the wheel listener has to re-attach each time it comes back.
  const scrollerRef = useWheelHorizontalScroll<HTMLDivElement>();

  const handleSort = (column: Column<T>) => {
    if (dnd.wasDragged()) return;
    if (!column.sortable || !onSort) return;
    const newOrder =
      sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newOrder);
  };

  // `wrapperRef` stays mounted across the loading -> loaded transition so
  // `useElementWidth`'s ResizeObserver attaches once and keeps working: an
  // early return here (skipping this div while loading) would leave the
  // effect's `ref.current` null on its one run, and it never gets a second
  // chance to subscribe once data arrives (the ref object itself never
  // changes identity, so the effect never reruns).
  return (
    <div ref={wrapperRef} className={className}>
      {loading ? (
        <div className="card">
          <div className="animate-pulse">
            <div className="h-4 gd-skel w-full mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 gd-skel w-full"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {prefs.enabled && (
            <div className="gd-table-tools">
              <ColumnChooserButton prefs={prefs} />
            </div>
          )}

          {showCards ? (
            <CardList
              data={data}
              columns={effectiveColumns}
              emptyMessage={emptyMessage}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
              renderExpanded={renderExpanded}
              twoUp={width !== null && width >= CARD_TWO_UP_PX}
            />
          ) : (
            <div ref={scrollerRef} className="overflow-x-auto">
              <table className="gd-table min-w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    {effectiveColumns.map((column) => {
                      const draggable = prefs.enabled && !column.pinned;
                      return (
                      <th
                        key={column.key}
                        scope="col"
                        className={cn(
                          'text-left',
                          column.sortable && onSort &&
                            'cursor-pointer select-none transition-colors hover:text-secondary-700',
                          draggable && 'gd-drag-th',
                          draggable && dnd.draggingKey === column.key && 'gd-drag-th--dragging',
                          draggable && dnd.overKey === column.key && dnd.dropSide === 'before' && 'gd-drag-th--over-before',
                          draggable && dnd.overKey === column.key && dnd.dropSide === 'after' && 'gd-drag-th--over-after',
                          column.className
                        )}
                        onClick={() => handleSort(column)}
                        {...(draggable
                          ? { ...dnd.getTargetProps(column.key), ...dnd.getHandleProps(column.key) }
                          : {})}
                      >
                        <div className="flex items-center gap-1.5">
                          {draggable && (
                            <GripVertical className="gd-drag-grip h-3.5 w-3.5 text-secondary-300" aria-hidden="true" />
                          )}
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
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={effectiveColumns.length}
                        className="px-6 py-14 text-center text-sm text-secondary-500"
                      >
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    data.map((row, rowIndex) => {
                      const expanded = renderExpanded?.(row, rowIndex);

                      return (
                        <React.Fragment key={rowIndex}>
                          <tr>
                            {effectiveColumns.map((column) => {
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

                          {expanded ? (
                            <tr>
                              <td colSpan={effectiveColumns.length} className="align-top">
                                {expanded}
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Table;
