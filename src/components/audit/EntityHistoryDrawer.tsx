import React, { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EntityHistoryPanel from './EntityHistoryPanel';

/**
 * A right-hand sheet around `EntityHistoryPanel`.
 *
 * It reuses `Modal.tsx`'s proven mechanics — the `gd-modal-overlay` element
 * that closes on click, the body-scroll lock, the "Escape belongs to the
 * topmost overlay" discipline — without importing `Modal`, which is a centred
 * dialog with its own header and sizing vocabulary. Wrapping a chronology in a
 * centred box would put a 32rem-wide reading column in the middle of the row it
 * came from; a sheet keeps the list visible beside it.
 *
 * **It renders through a portal into `document.body`**, and that is not a
 * detail. The drawer is opened from a `HistoryButton` inside a table cell, and
 * `position: fixed` escapes layout but NOT the cascade: living in the page's
 * `<td>` it inherited `Table.tsx`'s `whitespace-nowrap` (so every value in it
 * clipped mid-word, and a rename showed two pixel-identical strings) and its
 * own `<td>`s were matched by `.gd-table tbody td` (so the diff table's values
 * sat 10px below their labels). A portal is the only fix that closes the whole
 * class of problem rather than the two symptoms that were noticed; the explicit
 * `whitespace-normal` below is a second line of defence for any future host.
 *
 * Two deliberate differences from `Modal`:
 *
 *  - **Escape is captured.** A `Modal` open underneath registers its own
 *    document-level listener in the bubble phase. Listening in the CAPTURE
 *    phase and stopping propagation means the drawer, which is always the
 *    overlay opened last, takes Escape and the form underneath keeps its
 *    unsaved input.
 *  - **The scroll lock restores what it found**, rather than assuming `unset`.
 *    Closing a drawer opened over a modal must not unlock the page behind the
 *    modal that is still on screen.
 */

/** Open drawers, in opening order. Escape belongs to the last one. */
const openDrawers: number[] = [];
let drawerSequence = 0;

export interface EntityHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** The snake_case table name (`sales_orders`), never a label. */
  entityKey: string;
  uuid?: string | null;
  /** The record's own name or code, shown under the title. */
  recordLabel?: string;
}

const EntityHistoryDrawer: React.FC<EntityHistoryDrawerProps> = ({
  isOpen,
  onClose,
  entityKey,
  uuid,
  recordLabel,
}) => {
  const { t } = useTranslation();
  const titleId = useId();
  /** This instance's place in the stack; null while closed. */
  const stackId = useRef<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  // Membership depends on `isOpen` ALONE: an inline `onClose` changes identity
  // on every parent render, and re-registering would reorder the stack.
  useEffect(() => {
    if (!isOpen) return;

    drawerSequence += 1;
    const id = drawerSequence;
    stackId.current = id;
    openDrawers.push(id);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    returnFocusTo.current = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();

    return () => {
      stackId.current = null;
      const index = openDrawers.indexOf(id);
      if (index !== -1) openDrawers.splice(index, 1);
      if (openDrawers.length === 0) {
        document.body.style.overflow = previousOverflow;
      }
      // Back to the clock the reader clicked, so the keyboard does not restart
      // at the top of a 40-row table.
      returnFocusTo.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (openDrawers[openDrawers.length - 1] !== stackId.current) return;

      event.stopPropagation();
      event.preventDefault();
      onClose();
    };

    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isOpen, onClose]);

  const handleOverlayClick = useCallback(() => onClose(), [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 whitespace-normal">
      <div
        className="gd-modal-overlay fixed inset-0 animate-fade-in"
        aria-hidden="true"
        onClick={handleOverlayClick}
        data-testid="history-drawer-overlay"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="history-drawer"
        className="animate-slide-in-right fixed inset-y-0 right-0 flex w-full flex-col whitespace-normal border-l border-secondary-200 bg-white shadow-xl sm:w-[28rem] lg:w-[32rem]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-secondary-200 px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-sm font-semibold text-secondary-900">
              {t('audit.title')}
            </h2>
            {recordLabel && (
              <p
                className="truncate text-xs text-secondary-500"
                data-testid="history-drawer-record"
              >
                {recordLabel}
              </p>
            )}
          </div>

          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label={t('audit.close')}
            data-testid="history-drawer-close"
            className="-mr-1 rounded-md p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <EntityHistoryPanel entityKey={entityKey} uuid={uuid} />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EntityHistoryDrawer;
