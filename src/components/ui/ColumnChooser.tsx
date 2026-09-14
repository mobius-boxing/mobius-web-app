import React, { useState } from 'react';
import { Columns3, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { useDragReorder } from '../../hooks/useDragReorder';
import Button from './Button';
import Modal from './Modal';
import type { ColumnState, UseColumnPreferencesResult } from '../../hooks/useColumnPreferences';

export interface ColumnChooserButtonProps<T> {
  prefs: UseColumnPreferencesResult<T>;
}

/** The tools-row button `Table` renders when `listId` is set; owns its own open/close state. */
export function ColumnChooserButton<T>({ prefs }: ColumnChooserButtonProps<T>) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-label={t('table.columns')}
      >
        <Columns3 className="h-4 w-4" />
        <span className="hidden sm:inline">{t('table.columns')}</span>
      </Button>
      <ColumnChooser
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        states={prefs.states}
        isCustomized={prefs.isCustomized}
        isPersisted={prefs.isPersisted}
        onToggle={prefs.setVisible}
        onMove={prefs.move}
        onMoveTo={prefs.moveTo}
        onReset={prefs.reset}
      />
    </>
  );
}

export interface ColumnChooserProps<T> {
  isOpen: boolean;
  onClose: () => void;
  states: ColumnState<T>[];
  isCustomized: boolean;
  /** False when storage is unavailable, refused the last write, or no user is known (A-2). */
  isPersisted: boolean;
  onToggle: (key: string, visible: boolean) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onMoveTo: (key: string, targetKey: string) => void;
  onReset: () => void;
}

/** The modal body; exported so tests can drive it without the button's open state. */
export function ColumnChooser<T>({
  isOpen,
  onClose,
  states,
  isCustomized,
  isPersisted,
  onToggle,
  onMove,
  onMoveTo,
  onReset,
}: ColumnChooserProps<T>) {
  const { t } = useTranslation();
  const visibleCount = states.filter((s) => s.visible).length;
  const pinnedKeys = new Set(states.filter((s) => s.pinned).map((s) => s.column.key));
  const dnd = useDragReorder({
    onDrop: onMoveTo,
    canDrag: (key) => !pinnedKeys.has(key),
    canDrop: (key) => !pinnedKeys.has(key),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('table.columnsTitle')} size="sm">
      <p className="text-sm text-secondary-500 mb-3">{t('table.columnsHint')}</p>
      {!isPersisted && (
        <p className="text-sm text-amber-600 mb-3">{t('table.notSaved')}</p>
      )}

      <ul className="divide-y divide-secondary-100 -mx-1">
        {states.map((state, index) => {
          const label = state.column.label ?? state.column.header;
          const isLastVisible = state.visible && visibleCount <= 1;
          const canHide = state.hideable && !isLastVisible;
          const canMoveUp = !state.pinned && states.slice(0, index).some((s) => !s.pinned);
          const canMoveDown = !state.pinned && states.slice(index + 1).some((s) => !s.pinned);

          const key = state.column.key;
          const isDragging = dnd.draggingKey === key;
          const isOver = dnd.overKey === key;

          return (
            <li
              key={key}
              {...(!state.pinned ? dnd.getTargetProps(key) : {})}
              className={cn(
                'flex items-center gap-2 px-1 py-2',
                'gd-drag-row',
                isDragging && 'gd-drag-row--dragging',
                isOver && dnd.dropSide === 'before' && 'gd-drag-row--over-before',
                isOver && dnd.dropSide === 'after' && 'gd-drag-row--over-after'
              )}
            >
              {state.pinned ? (
                <span className="p-1 text-secondary-300" aria-hidden="true">
                  <GripVertical className="h-4 w-4" />
                </span>
              ) : (
                <button
                  type="button"
                  aria-label={t('table.dragToReorder', { label })}
                  title={t('table.dragToReorder', { label })}
                  className="gd-drag-handle p-1 rounded-md text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700 cursor-grab active:cursor-grabbing"
                  {...dnd.getHandleProps(key)}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              )}
              <input
                type="checkbox"
                checked={state.visible}
                disabled={!canHide}
                onChange={(e) => onToggle(state.column.key, e.target.checked)}
                aria-label={t('table.showColumn', { label })}
                className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500/30 disabled:opacity-50"
              />
              <span className="flex-1 text-sm text-secondary-800 truncate">{label}</span>
              {state.pinned && (
                <span className="text-xs text-secondary-400">{t('table.pinned')}</span>
              )}
              {!state.pinned && !state.hideable && (
                <span className="text-xs text-secondary-400">{t('table.alwaysVisible')}</span>
              )}
              <button
                type="button"
                onClick={() => onMove(state.column.key, -1)}
                disabled={!canMoveUp}
                aria-label={t('table.moveUp', { label })}
                className="p-1 rounded-md text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onMove(state.column.key, 1)}
                disabled={!canMoveDown}
                aria-label={t('table.moveDown', { label })}
                className="p-1 rounded-md text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-100">
        <Button variant="secondary" size="sm" onClick={onReset} disabled={!isCustomized}>
          {t('table.resetColumns')}
        </Button>
        <Button variant="primary" size="sm" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  );
}

export default ColumnChooserButton;
