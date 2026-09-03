import React, { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEntityHistory } from '../../hooks/useEntityHistory';
import { AuditDiffEntry, AuditRowView, HistoryEntry } from '../../types/audit';
import { cn } from '../../utils/cn';
import ErrorMessage from '../ui/ErrorMessage';
import {
  Translate,
  absoluteTime,
  describeDiffEntry,
  entityLabel,
  fieldLabel,
  fieldPreviewOf,
  filterNoise,
  headlineOf,
  operationLabel,
  relativeTime,
} from './diff';

/**
 * One record's history, as a body with no opinion about where it sits.
 *
 * It owns the fetch, the entry list and the diff tables and nothing else — no
 * overlay, no positioning, no width. `EntityHistoryDrawer` wraps it in a sheet;
 * a detail page can render it in a tab; the two must show the same thing.
 *
 * The reading order is the argument the panel is settling: *what happened*
 * (headline), *who did it and when* (attribution), *which fields* (preview) —
 * so the common question is answered without expanding anything, and the diff
 * table is there for the one entry that turns out to matter.
 */

/** `HISTORY_ROWS_PER_ENTRY_CAP` in the API. A capped entry says so. */
const ROWS_PER_ENTRY_CAP = 200;

export interface EntityHistoryPanelProps {
  /** The snake_case table name (`sales_orders`), never a label. */
  entityKey: string;
  /** The record's uuid. While absent the panel stays idle. */
  uuid?: string | null;
  /** False keeps the panel idle: no request is issued. */
  enabled?: boolean;
  className?: string;
}

const EntityHistoryPanel: React.FC<EntityHistoryPanelProps> = ({
  entityKey,
  uuid,
  enabled = true,
  className,
}) => {
  const { t } = useTranslation();
  const translate = t as Translate;

  const { entries, loading, error, notFound, page, setPage, totalPages, refresh } =
    useEntityHistory({ entityKey, uuid, enabled });

  const [expanded, setExpanded] = useState<string[]>([]);

  const toggle = useCallback((transactionRef: string) => {
    setExpanded((open) =>
      open.includes(transactionRef)
        ? open.filter((ref) => ref !== transactionRef)
        : [...open, transactionRef]
    );
  }, []);

  const body = (): React.ReactNode => {
    // A skeleton, not a spinner: in a 32rem column a centred spinner reads as
    // a broken page, and three rows say what is about to arrive.
    if (loading && entries.length === 0) return <HistorySkeleton />;

    // A real failure. Retrying can change the answer, so it is offered.
    if (error) {
      return (
        <div className="px-4 py-6" data-testid="history-error">
          <ErrorMessage message={error} />
          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            data-testid="history-retry"
            className="mt-3 rounded-md border border-secondary-300 px-3 py-1.5 text-xs font-medium text-secondary-700 transition-colors hover:bg-secondary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            {t('audit.retry')}
          </button>
        </div>
      );
    }

    // 404 and an empty page are the same fact to the reader, and the API
    // answers 404 both for "nothing recorded" and for "not your company's
    // record" on purpose. One honest state says both, and offers no retry:
    // a retry cannot change either answer. Deletion is NOT one of the
    // meanings, so the copy must not suggest it.
    if (notFound || entries.length === 0) {
      return (
        <div className="px-4 py-12 text-center" data-testid="history-empty">
          <History
            className="mx-auto h-6 w-6 text-secondary-300"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-secondary-700">
            {t('audit.empty.title')}
          </p>
          <p className="mx-auto mt-1 max-w-[40ch] text-xs leading-relaxed text-secondary-500">
            {t('audit.empty.description')}
          </p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-secondary-100">
        {entries.map((entry) => (
          <HistoryEntryItem
            key={entry.transactionRef}
            entry={entry}
            expanded={expanded.includes(entry.transactionRef)}
            onToggle={toggle}
            t={translate}
          />
        ))}
      </ul>
    );
  };

  return (
    <div className={cn('text-secondary-900', className)}>
      {body()}

      {totalPages > 1 && (
        <HistoryPager
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          t={translate}
        />
      )}
    </div>
  );
};

const HistorySkeleton: React.FC = () => (
  <div className="space-y-5 px-4 py-4" data-testid="history-loading" aria-busy="true">
    {[0, 1, 2].map((row) => (
      <div key={row} className="space-y-2" data-testid="history-skeleton-row">
        <div className="gd-skel h-4 w-2/3" />
        <div className="gd-skel h-3 w-1/3" />
        <div className="gd-skel h-3 w-1/2" />
      </div>
    ))}
  </div>
);

interface HistoryEntryItemProps {
  entry: HistoryEntry;
  expanded: boolean;
  onToggle: (transactionRef: string) => void;
  t: Translate;
}

const HistoryEntryItem: React.FC<HistoryEntryItemProps> = ({
  entry,
  expanded,
  onToggle,
  t,
}) => {
  const preview = fieldPreviewOf(entry, t);

  return (
    <li className={cn(expanded && 'bg-secondary-50')}>
      {/* The row IS the affordance: a chevron-only hit target makes the reader
          aim at a 16px square to read three lines they already looked at. */}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => onToggle(entry.transactionRef)}
        data-testid={`history-entry-${entry.transactionRef}`}
        className="w-full px-4 py-3 text-left transition-colors hover:bg-secondary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600"
      >
        <span className="block text-sm font-medium text-secondary-900">
          {headlineOf(entry, t)}
        </span>

        <span className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-secondary-500">
          <ActorSlot entry={entry} t={t} />
          <span aria-hidden="true">·</span>
          <time dateTime={entry.occurredAt} title={absoluteTime(entry.occurredAt)}>
            {relativeTime(entry.occurredAt, t)}
          </time>
        </span>

        {preview.labels.length > 0 && (
          <span className="mt-1.5 block truncate text-xs text-secondary-400">
            {preview.labels.join(', ')}
            {preview.extra > 0 && ` ${t('audit.more', { count: preview.extra })}`}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4" data-testid={`history-detail-${entry.transactionRef}`}>
          {entry.rows.map((row, index) => (
            <HistoryRowDiff key={row.uuid} row={row} isChild={index > 0} t={t} />
          ))}

          {entry.truncated && (
            <p className="mt-3 text-[11px] text-secondary-400">
              {t('audit.diff.truncated', { count: ROWS_PER_ENTRY_CAP })}
            </p>
          )}
        </div>
      )}
    </li>
  );
};

/**
 * Who did it. When the ledger could not attribute the change it says `Sistema`
 * and explains itself — a blank where a person's name belongs is the single
 * worst thing this panel could do, and "—" is barely better.
 */
const ActorSlot: React.FC<{ entry: HistoryEntry; t: Translate }> = ({
  entry,
  t,
}) => {
  const { actor } = entry;

  if (actor.attributed === false) {
    return (
      <span
        data-testid="history-actor"
        title={t('audit.actor.systemHint')}
        aria-label={t('audit.actor.systemHint')}
      >
        {t('audit.actor.system')}
      </span>
    );
  }

  return (
    <>
      <span data-testid="history-actor">
        {t('audit.actor.by', {
          name: actor.username || t('audit.actor.unknownUser'),
        })}
      </span>
      {actor.isSupport && (
        <span
          title={t('audit.actor.supportHint')}
          className="inline-flex items-center rounded-full border border-secondary-300 px-1.5 py-px text-[11px] font-medium text-secondary-500"
        >
          {t('audit.actor.support')}
        </span>
      )}
    </>
  );
};

/**
 * One table's share of a transaction: `campo · antes · después`.
 *
 * A table, not a definition list, because the reader compares down a column.
 * No arrow column either — direction is carried by the header order and by
 * `Antes` sitting a shade back from `Después`, so the eye lands on the new
 * value, which is what the reader came for.
 */
const HistoryRowDiff: React.FC<{
  row: AuditRowView;
  isChild: boolean;
  t: Translate;
}> = ({ row, isChild, t }) => {
  const fields = filterNoise(row.diff);

  return (
    <div className={cn(isChild && 'mt-4')}>
      {isChild && (
        <p className="mb-1.5 text-xs font-medium text-secondary-500">
          {entityLabel(row.entityName, t)} · {operationLabel(row.operation, t)}
        </p>
      )}

      {fields.length === 0 ? (
        <p className="text-xs text-secondary-500">
          {row.operation === 'Alta'
            ? t('audit.diff.created')
            : t('audit.diff.noFields')}
        </p>
      ) : (
        <table className="w-full table-fixed text-xs" data-testid={`history-diff-${row.uuid}`}>
          <thead>
            <tr className="border-b border-secondary-200 text-left text-[11px] font-medium uppercase tracking-wide text-secondary-400">
              <th scope="col" className="w-1/3 py-1.5 pr-3">
                {t('audit.diff.field')}
              </th>
              <th scope="col" className="w-1/3 py-1.5 pr-3">
                {t('audit.diff.before')}
              </th>
              <th scope="col" className="w-1/3 py-1.5">
                {t('audit.diff.after')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100">
            {fields.map((field) => (
              <HistoryDiffRow
                key={field.key}
                entityKey={row.entityName}
                field={field}
                t={t}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

/**
 * `align-top` sits on every cell, not on the `<tbody>`: `vertical-align` is not
 * an inherited property, so the group-level class never reached a cell and a
 * two-line label centred itself against a one-line value.
 */
const HistoryDiffRow: React.FC<{
  entityKey: string;
  field: AuditDiffEntry;
  t: Translate;
}> = ({ entityKey, field, t }) => {
  const view = describeDiffEntry(field, t);

  return (
    <tr data-testid={`history-field-${field.key}`}>
      {/* `title` is the raw column name, so the raw truth is one hover away
          even where `audit.fields.*` has a label. */}
      <th
        scope="row"
        title={field.key}
        className="py-1.5 pr-3 text-left align-top font-medium text-secondary-700"
      >
        <span className="line-clamp-2 break-words">
          {fieldLabel(entityKey, field.key, t)}
        </span>
      </th>

      {view.kind === 'note' ? (
        // One cell across both columns. Two `<Vacío>`s side by side would be a
        // lie about a password change and a guess about a foreign key.
        <td
          colSpan={2}
          title={view.title}
          className="py-1.5 align-top italic text-secondary-500"
        >
          {view.text}
        </td>
      ) : (
        <>
          <td
            title={view.before.title}
            className={cn(
              'py-1.5 pr-3 align-top tabular-nums',
              view.before.empty ? 'italic text-secondary-400' : 'text-secondary-500'
            )}
          >
            <span className="line-clamp-2 break-words">{view.before.text}</span>
          </td>
          <td
            title={view.after.title}
            className={cn(
              'py-1.5 align-top tabular-nums',
              view.after.empty ? 'italic text-secondary-400' : 'text-secondary-900'
            )}
          >
            <span className="line-clamp-2 break-words">{view.after.text}</span>
          </td>
        </>
      )}
    </tr>
  );
};

/**
 * Prev / next over transactions.
 *
 * NOT `components/ui/Pagination`: that component's sentence is "showing 1-20
 * of 137", and `useEntityHistory` exposes `totalPages` without a total. Feeding
 * it `totalPages * limit` would print a number the API never said. A page
 * counter states only what is known.
 */
const HistoryPager: React.FC<{
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  t: Translate;
}> = ({ page, totalPages, onPageChange, t }) => (
  <div className="flex items-center justify-between gap-3 border-t border-secondary-100 px-4 py-3">
    <span className="text-xs text-secondary-500">
      {t('audit.pageOf', { page, total: totalPages })}
    </span>
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label={t('pagination.previous')}
        data-testid="history-prev-page"
        className="rounded-md p-1.5 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={t('pagination.next')}
        data-testid="history-next-page"
        className="rounded-md p-1.5 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

export default EntityHistoryPanel;
