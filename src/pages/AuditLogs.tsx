import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import Table from '../components/ui/Table';
import {
  Translate,
  changedKeysOf,
  describeDiffEntry,
  entityLabel,
  fieldLabel,
  filterNoise,
  operationLabel,
} from '../components/audit/diff';
import { FetchParams, useEntityList } from '../hooks/useEntityList';
import { usePermissions } from '../hooks/usePermissions';
import { exportAuditCsv, listAuditEntities, listAuditLogs } from '../services/audit';
import {
  AuditCsvExport,
  AuditDiffEntry,
  AuditEntity,
  AuditLogFilters,
  AuditLogListParams,
  AuditLogListResult,
  AuditOperation,
  AuditRowView,
  AuditSourceValue,
} from '../types/audit';
import { logger } from '../utils/logger';

/**
 * Auditoría — the ledger browser.
 *
 * Same vocabulary as the drawer on a wider surface: every decision about what
 * a diff *says* comes from `components/audit/diff.ts`, so a change read here
 * and the same change read from a record's history can never describe
 * themselves differently. This page owns only the filtering, the table and the
 * export.
 *
 * Two things it refuses to do quietly:
 *  - the API narrows an otherwise unbounded read to the last 90 days; when it
 *    does, that is stated above the table, permanently, not in a toast. A
 *    result set that silently omits data is the thing an audit log may least
 *    afford;
 *  - the CSV export is capped at 10 000 rows, and a capped file says so, with
 *    the row count the server reported.
 */

/** The `operation` CHECK vocabulary. */
const OPERATIONS: AuditOperation[] = ['Alta', 'Baja', 'Modificacion'];

/** The `source` CHECK vocabulary. */
const SOURCES: AuditSourceValue[] = [
  'api',
  'job',
  'seed',
  'migration',
  'script',
  'sql',
];

/**
 * The same 300 ms `useEntityList` gives its search box. Typing a username
 * should not put one request on the wire per keystroke, and a select is no
 * worse for waiting a third of a second.
 */
const FILTER_DEBOUNCE_MS = 300;

/** What the filter bar holds. All strings: these are form values. */
type DraftFilters = {
  entityName: string;
  operation: string;
  source: string;
  username: string;
  from: string;
  to: string;
  changedKey: string;
};

const EMPTY_DRAFT: DraftFilters = {
  entityName: '',
  operation: '',
  source: '',
  username: '',
  from: '',
  to: '',
  changedKey: '',
};

/**
 * `dd/MM/yyyy HH:mm`, 24-hour and zero-padded — the format
 * `SalesOrderApprovalControl`'s `fmt` established (divergence D-6) and the one
 * `utils/dates.ts` names as "the zero-padded Procusto format this module
 * already uses for timestamps".
 *
 * NOT `toLocaleString()`: that follows the browser's default locale, so a
 * Spanish UI printed `9/3/2026 02:06 PM` — American field order, and on any
 * day of the month ≤ 12 genuinely ambiguous. The one page whose whole job is
 * settling "when did this happen" cannot afford a date two readers parse
 * differently.
 *
 * `withSeconds` is for the hover only: a row is an event and its exact instant
 * is the audit fact, while the seconds are noise in a 20-row column.
 */
const formatInstant = (iso: string, withSeconds = false): string => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;

  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
  const time = `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;

  return withSeconds
    ? `${day} ${time}:${pad(parsed.getSeconds())}`
    : `${day} ${time}`;
};

/**
 * `to` is compared as `occurredAt <= to`, so a bare `2026-09-03` means that
 * day's midnight and silently drops everything that happened during the day
 * the user asked for. An `<input type="date">` can only produce a bare day, so
 * the end of it is supplied here. The API's ISO check accepts the result.
 */
const endOfDay = (day: string): string =>
  /^\d{4}-\d{2}-\d{2}$/.test(day) ? `${day}T23:59:59.999` : day;

const toQueryFilters = (draft: DraftFilters): AuditLogFilters => {
  const query: AuditLogFilters = {};
  if (draft.entityName) query.entityName = draft.entityName;
  if (draft.operation) query.operation = draft.operation as AuditOperation;
  if (draft.source) query.source = draft.source as AuditSourceValue;
  if (draft.username.trim()) query.username = draft.username.trim();
  if (draft.from) query.from = draft.from;
  if (draft.to) query.to = endOfDay(draft.to);
  if (draft.changedKey.trim()) query.changedKey = draft.changedKey.trim();
  return query;
};

/** What the last response said about the window it actually read. */
type WindowState = {
  appliedFrom: string | null;
  /** True when the *request* carried a date bound, so nothing was defaulted. */
  dateFiltered: boolean;
};

const AuditLogs: React.FC = () => {
  const { t } = useTranslation();
  const translate = t as Translate;
  const { has } = usePermissions();

  const [draft, setDraft] = useState<DraftFilters>(EMPTY_DRAFT);
  const [entities, setEntities] = useState<AuditEntity[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [windowState, setWindowState] = useState<WindowState>({
    appliedFrom: null,
    dateFiltered: false,
  });

  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<AuditCsvExport | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  /**
   * `includeDiff` because the row expands in place: asking for the diff with
   * the page it belongs to costs one request instead of one per expansion,
   * and the expanded table then opens with no second loading state.
   *
   * The window is recorded here rather than from state, so what the notice
   * says always belongs to the request that produced the rows on screen.
   */
  const fetchLogs = useCallback(
    async (params: FetchParams): Promise<AuditLogListResult> => {
      const query = params as AuditLogListParams;
      const result = await listAuditLogs({ ...query, includeDiff: true });
      setWindowState({
        appliedFrom: result.appliedFrom,
        dateFiltered: Boolean(query.from || query.to),
      });
      return result;
    },
    []
  );

  const {
    data: rows,
    loading,
    error,
    search,
    setSearch,
    setFilters,
    paginationProps,
  } = useEntityList<AuditRowView>({ fetchFn: fetchLogs });

  // Debounced commit of the whole filter bar. A new-but-equal object is a
  // no-op downstream: `useEntityList` refetches on the filters' JSON, not on
  // their identity, so the mount pass costs nothing.
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters(toQueryFilters(draft) as Record<string, unknown>);
      setExpanded(null);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [draft, setFilters]);

  useEffect(() => {
    let live = true;
    listAuditEntities()
      .then((list) => {
        if (live) setEntities(list);
      })
      .catch((err: unknown) => {
        // A missing menu narrows the filter bar; it must not blank the page.
        logger.error('Failed to load audit entities:', err);
      });
    return () => {
      live = false;
    };
  }, []);

  const entityOptions = useMemo(
    () =>
      entities
        .map((entity) => ({
          key: entity.key,
          label: translate(entity.labelKey, { defaultValue: entity.key }),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [entities, translate]
  );

  const setField = useCallback(
    (field: keyof DraftFilters, value: string) => {
      setDraft((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setSearch('');
  }, [setSearch]);

  const activeCount =
    Object.values(draft).filter((value) => value !== '').length +
    (search ? 1 : 0);

  const canExport = has('audit.export');

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    setExportResult(null);
    try {
      const filters = toQueryFilters(draft);
      if (search.trim()) filters.search = search.trim();
      // Through axios, never a hand-built anchor: the bearer token lives in
      // the `mobius_session` cookie and is attached by the shared instance's
      // request interceptor, so a plain download link would simply 401.
      setExportResult(await exportAuditCsv(filters));
    } catch (err: unknown) {
      logger.error('Audit CSV export failed:', err);
      setExportError(t('auditLogs.export.error'));
    } finally {
      setExporting(false);
    }
  }, [draft, search, t]);

  const showWindowNotice =
    Boolean(windowState.appliedFrom) && !windowState.dateFiltered;

  const columns = useMemo(
    () => [
      {
        key: 'occurredAt',
        header: t('auditLogs.columns.occurredAt'),
        render: (_value: unknown, row: AuditRowView) => {
          const open = expanded === row.uuid;
          return (
            // The chevron rides in the timestamp cell rather than owning a
            // column of its own: a 16 px glyph was buying 72 px of table, and
            // a wider hit target on the row's first real cell is the better
            // affordance anyway.
            <button
              type="button"
              aria-expanded={open}
              aria-label={t(open ? 'auditLogs.collapse' : 'auditLogs.expand')}
              data-testid={`audit-expand-${row.uuid}`}
              onClick={() => setExpanded(open ? null : row.uuid)}
              className="-ml-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-secondary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              {open ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-secondary-400" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-secondary-400" />
              )}
              <time
                dateTime={row.occurredAt}
                title={formatInstant(row.occurredAt, true)}
                className="text-sm tabular-nums text-secondary-700"
              >
                {formatInstant(row.occurredAt)}
              </time>
            </button>
          );
        },
      },
      {
        key: 'entityCode',
        header: t('auditLogs.columns.record'),
        // Identity and kind are one fact, so they are one cell on two lines.
        // Apart they cost two columns, and `Etapa de ruta` sitting a column
        // away from `1` is how a reader ends up with neither.
        render: (_value: unknown, row: AuditRowView) => (
          <RecordCell row={row} t={translate} />
        ),
      },
      {
        key: 'operation',
        header: t('auditLogs.columns.operation'),
        render: (_value: unknown, row: AuditRowView) => (
          // A word, not a coloured pill: three chips on every row would turn a
          // chronology into a Christmas tree.
          <span className="text-sm text-secondary-700">
            {operationLabel(row.operation, translate)}
          </span>
        ),
      },
      {
        key: 'changedKeys',
        header: t('auditLogs.columns.fields'),
        render: (_value: unknown, row: AuditRowView) => (
          <FieldsCell row={row} t={translate} />
        ),
      },
      {
        key: 'actor',
        header: t('auditLogs.columns.actor'),
        render: (_value: unknown, row: AuditRowView) => (
          <ActorCell row={row} t={translate} />
        ),
      },
    ],
    [expanded, t, translate]
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="gd-page-title">{t('auditLogs.title')}</h1>
            <p className="text-secondary-600">{t('auditLogs.subtitle')}</p>
          </div>

          {canExport && (
            <Button
              variant="outline"
              onClick={handleExport}
              loading={exporting}
              data-testid="audit-export"
              className="inline-flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('auditLogs.export.action')}
            </Button>
          )}
        </div>

        <div className="gd-filters" data-testid="audit-filter-bar">
          <div className="gd-filters-head">
            <span className="gd-eyebrow">{t('auditLogs.filters.legend')}</span>
            <Button
              variant="ghost"
              size="sm"
              disabled={activeCount === 0}
              data-testid="audit-filter-clear"
              onClick={clearFilters}
            >
              {t('auditLogs.filters.clear')}
            </Button>
          </div>

          <div className="gd-filters-grid">
            <label className="gd-filters-field">
              <span className="gd-label">{t('auditLogs.filters.search')}</span>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('auditLogs.filters.searchPlaceholder')}
              />
            </label>

            <label className="gd-filters-field">
              <span className="gd-label">{t('auditLogs.filters.entity')}</span>
              <select
                name="entityName"
                className="input-field"
                data-testid="audit-filter-entity"
                value={draft.entityName}
                onChange={(event) => setField('entityName', event.target.value)}
              >
                <option value="">{t('auditLogs.filters.entityAll')}</option>
                {entityOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="gd-filters-field">
              <span className="gd-label">{t('auditLogs.filters.operation')}</span>
              <select
                name="operation"
                className="input-field"
                data-testid="audit-filter-operation"
                value={draft.operation}
                onChange={(event) => setField('operation', event.target.value)}
              >
                <option value="">{t('auditLogs.filters.operationAll')}</option>
                {OPERATIONS.map((operation) => (
                  <option key={operation} value={operation}>
                    {operationLabel(operation, translate)}
                  </option>
                ))}
              </select>
            </label>

            <label className="gd-filters-field">
              <span className="gd-label">{t('auditLogs.filters.source')}</span>
              <select
                name="source"
                className="input-field"
                data-testid="audit-filter-source"
                value={draft.source}
                onChange={(event) => setField('source', event.target.value)}
              >
                <option value="">{t('auditLogs.filters.sourceAll')}</option>
                {SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {t(`auditLogs.source.${source}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="gd-filters-field">
              <span className="gd-label">{t('auditLogs.filters.username')}</span>
              <input
                name="username"
                type="text"
                className="input-field"
                data-testid="audit-filter-username"
                placeholder={t('auditLogs.filters.usernamePlaceholder')}
                value={draft.username}
                onChange={(event) => setField('username', event.target.value)}
              />
            </label>

            <label className="gd-filters-field">
              <span className="gd-label">{t('auditLogs.filters.changedKey')}</span>
              <input
                name="changedKey"
                type="text"
                className="input-field"
                data-testid="audit-filter-changed-key"
                placeholder={t('auditLogs.filters.changedKeyPlaceholder')}
                value={draft.changedKey}
                onChange={(event) => setField('changedKey', event.target.value)}
              />
            </label>

            <label className="gd-filters-field">
              <span className="gd-label">{t('auditLogs.filters.from')}</span>
              <input
                name="from"
                type="date"
                className="input-field"
                data-testid="audit-filter-from"
                aria-label={t('auditLogs.filters.from')}
                value={draft.from}
                onChange={(event) => setField('from', event.target.value)}
              />
            </label>

            <label className="gd-filters-field">
              <span className="gd-label">{t('auditLogs.filters.to')}</span>
              <input
                name="to"
                type="date"
                className="input-field"
                data-testid="audit-filter-to"
                aria-label={t('auditLogs.filters.to')}
                value={draft.to}
                onChange={(event) => setField('to', event.target.value)}
              />
            </label>
          </div>
        </div>

        {exportError && <ErrorMessage message={exportError} />}

        {exportResult && (
          <div
            className={
              exportResult.truncated
                ? 'gd-alert gd-alert-danger'
                : 'gd-alert gd-alert-success'
            }
            role="status"
            data-testid={
              exportResult.truncated ? 'audit-export-truncated' : 'audit-export-done'
            }
          >
            <p>
              {exportResult.truncated
                ? t(
                    exportResult.rows === null
                      ? 'auditLogs.export.truncatedUnknown'
                      : 'auditLogs.export.truncated',
                    { file: exportResult.fileName, rows: exportResult.rows }
                  )
                : t('auditLogs.export.done', { file: exportResult.fileName })}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            {error && <ErrorMessage message={error} className="mb-4" />}

            {/* The window the API actually read. Persistent and above the
                table, because a reader who does not know a result set was
                narrowed will conclude the change they are looking for never
                happened. */}
            {showWindowNotice && (
              <p
                className="mb-4 text-sm text-secondary-500"
                data-testid="audit-window-notice"
              >
                {t('auditLogs.windowNotice', {
                  date: formatInstant(windowState.appliedFrom as string),
                })}
              </p>
            )}

            <Table
              columns={columns}
              data={rows}
              loading={loading}
              emptyMessage={t('auditLogs.empty')}
              renderExpanded={(row: AuditRowView) =>
                expanded === row.uuid ? (
                  <div
                    // `whitespace-normal` is a second line of defence, the same
                    // one `EntityHistoryDrawer` keeps: this region lives inside
                    // a `Table` cell, and every OTHER cell there is
                    // `whitespace-nowrap`. A future change that put the class on
                    // the row instead of the cell would clip every value in the
                    // diff mid-word without failing anything.
                    className="whitespace-normal bg-secondary-50 px-4 py-3"
                    data-testid={`audit-detail-${row.uuid}`}
                  >
                    <AuditRowDiff row={row} t={translate} />
                  </div>
                ) : null
              }
            />

            <Pagination {...paginationProps} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

/**
 * What the row is about: the record's own identity, and under it the kind of
 * thing it is.
 *
 * A child row is the case this exists for. `production_route_stages` carries
 * `entityCode = "1"` — the stage number, which on its own is not an identity
 * at all — so the second line names the parent's kind (`Etapa de ruta · en
 * Ruta de producción`) using `rootEntity`, which every child row carries.
 *
 * It stops there deliberately: the row knows `rootUuid` but not the parent's
 * code, and naming a route the ledger did not name would be a guess. The
 * parent's own row sits in the same transaction at the same timestamp, one
 * line away in this very list.
 */
const RecordCell: React.FC<{ row: AuditRowView; t: Translate }> = ({ row, t }) => {
  const kind = entityLabel(row.entityName, t);
  const parent =
    row.rootEntity && row.rootEntity !== row.entityName
      ? entityLabel(row.rootEntity, t)
      : null;

  return (
    <span className="block max-w-[9.5rem]" data-testid={`audit-record-${row.uuid}`}>
      <span
        className="block truncate text-sm font-medium text-secondary-900"
        title={row.entityDescription ?? undefined}
      >
        {row.entityCode || row.entityDescription || '—'}
      </span>
      <span
        className="block truncate text-xs text-secondary-500"
        title={parent ? `${row.entityName} → ${row.rootEntity}` : row.entityName}
      >
        {parent ? t('auditLogs.childOf', { kind, parent }) : kind}
      </span>
    </span>
  );
};

/**
 * Who did it. `attributed === false` reads `Sistema` and says why — the same
 * rule and the same strings the drawer uses; a blank where a person's name
 * belongs is the one thing an audit table must never print.
 */
const ActorCell: React.FC<{ row: AuditRowView; t: Translate }> = ({ row, t }) => {
  const { actor } = row;

  if (actor.attributed === false) {
    return (
      <span
        className="block max-w-[9.5rem] truncate text-sm text-secondary-500"
        data-testid="audit-actor"
      >
        <span title={t('audit.actor.systemHint')}>{t('audit.actor.system')}</span>
        {/* The source is never more wanted than right here: it is the whole
            explanation for why no name could be given. */}
        <SourceNote source={row.source} t={t} />
      </span>
    );
  }

  return (
    <span
      className="block max-w-[9.5rem] truncate text-sm text-secondary-700"
      data-testid="audit-actor"
      // A 23-character email clamps to ~20 here, and this was the one
      // truncation in the feature a reader could not recover by hovering —
      // the record cell and every diff value already carry their full text.
      // Without it the only ways back to a username are the filter and the CSV.
      title={actor.username ?? undefined}
    >
      {actor.username || t('audit.actor.unknownUser')}
      {actor.isSupport && (
        <span
          title={t('audit.actor.supportHint')}
          className="ml-1.5 inline-flex items-center rounded-full border border-secondary-300 px-1.5 py-px text-[11px] font-medium text-secondary-500"
        >
          {t('audit.actor.support')}
        </span>
      )}
      <SourceNote source={row.source} t={t} />
    </span>
  );
};

/**
 * Where the change came in, shown beside the actor rather than in a column of
 * its own: at 1280 px an eighth column pushed `Campos` — the one line that
 * makes the ledger scannable — off the edge of the table.
 *
 * `api` is the default and says nothing a username does not already say, so it
 * is left off. Every other source is precisely the explanation a reader wants
 * next to `Sistema`, and it is still a filter in its own right either way.
 */
const SourceNote: React.FC<{ source: AuditSourceValue; t: Translate }> = ({
  source,
  t,
}) => {
  if (source === 'api') return null;

  const label = t(`auditLogs.source.${source}`, { defaultValue: source });
  return (
    // The space before the `·` is a real character, not a margin. A separator
    // that exists only in CSS reads `Sistema· Base de datos` to anything that
    // takes the text rather than the pixels — copy-paste, a screen reader, a
    // test asserting on `textContent`.
    <span className="text-xs text-secondary-400" title={label}>
      {' · '}
      {label}
    </span>
  );
};

/** Up to three field labels, then `+N` — the drawer's scannable third line. */
const FieldsCell: React.FC<{ row: AuditRowView; t: Translate }> = ({ row, t }) => {
  const keys = changedKeysOf(row);
  if (keys.length === 0) {
    return (
      <span
        className="text-sm text-secondary-400"
        title={t('audit.diff.noFields')}
        data-testid={`audit-fields-${row.uuid}`}
      >
        —
      </span>
    );
  }

  const labels = keys.map((key) => fieldLabel(row.entityName, key, t));
  const shown = labels.slice(0, 3);
  const extra = labels.length - shown.length;

  return (
    // `Table` renders every cell `whitespace-nowrap`, so a twelve-field change
    // would otherwise stretch this column past the edge of the page. Clamped
    // here, complete in the title, and complete again once the row expands.
    <span
      className="block max-w-[9rem] truncate text-sm text-secondary-500"
      title={labels.join(', ')}
      data-testid={`audit-fields-${row.uuid}`}
    >
      {shown.join(', ')}
      {extra > 0 && ` ${t('audit.more', { count: extra })}`}
    </span>
  );
};

/**
 * `campo · antes · después`, decided entirely by `components/audit/diff.ts`:
 * the noise filter, the redacted statement, the unresolved statement and the
 * empty-value wording are that module's, not this page's.
 */
const AuditRowDiff: React.FC<{ row: AuditRowView; t: Translate }> = ({ row, t }) => {
  const fields = filterNoise(row.diff);

  if (fields.length === 0) {
    return (
      <p className="text-xs text-secondary-500">
        {row.operation === 'Alta' ? t('audit.diff.created') : t('audit.diff.noFields')}
      </p>
    );
  }

  return (
    <table className="w-full table-fixed text-xs" data-testid={`audit-diff-${row.uuid}`}>
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
      <tbody className="divide-y divide-secondary-100 align-top">
        {fields.map((field) => (
          <AuditDiffRow
            key={field.key}
            entityKey={row.entityName}
            field={field}
            t={t}
          />
        ))}
      </tbody>
    </table>
  );
};

const AuditDiffRow: React.FC<{
  entityKey: string;
  field: AuditDiffEntry;
  t: Translate;
}> = ({ entityKey, field, t }) => {
  const view = describeDiffEntry(field, t);

  return (
    <tr data-testid={`audit-field-${field.key}`}>
      <th
        scope="row"
        title={field.key}
        className="py-1.5 pr-3 text-left font-medium text-secondary-700"
      >
        <span className="line-clamp-2 break-words">
          {fieldLabel(entityKey, field.key, t)}
        </span>
      </th>

      {view.kind === 'note' ? (
        <td colSpan={2} title={view.title} className="py-1.5 italic text-secondary-500">
          {view.text}
        </td>
      ) : (
        <>
          <td
            title={view.before.title}
            className={`py-1.5 pr-3 tabular-nums ${
              view.before.empty ? 'italic text-secondary-400' : 'text-secondary-500'
            }`}
          >
            <span className="line-clamp-2 break-words">{view.before.text}</span>
          </td>
          <td
            title={view.after.title}
            className={`py-1.5 tabular-nums ${
              view.after.empty ? 'italic text-secondary-400' : 'text-secondary-900'
            }`}
          >
            <span className="line-clamp-2 break-words">{view.after.text}</span>
          </td>
        </>
      )}
    </tr>
  );
};

export default AuditLogs;
