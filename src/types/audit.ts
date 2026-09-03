/**
 * The audit ledger's read-side types.
 *
 * Transcribed from the API's `src/interfaces/audit-log/audit-log.interfaces.ts`
 * (P3, deployed at `444738c`). Only the READ side lives here: nothing in the
 * SPA ever constructs a ledger row, and the write path is a database trigger.
 *
 * The shaping rule behind all of them is the API's `sanitizeResponse`, which
 * deletes `id` and every key ending in `Id` whose value is a number: no numeric
 * id appears in any of these types, `transactionRef` is a string, and a diff is
 * an **array of objects** rather than a map (`{ key: 'customerId' }` survives
 * the sanitizer, `{ customerId: 7 }` does not).
 */

import { PaginatedResponse } from './index';

/** The `operation` CHECK vocabulary. */
export type AuditOperation = 'Alta' | 'Baja' | 'Modificacion';

/**
 * Where a row came from. `sql` is the trigger's default — a psql session, an
 * upload route, a job that is not wrapped yet — so a null `username` always has
 * an explanation.
 */
export type AuditSourceValue =
  | 'api'
  | 'job'
  | 'seed'
  | 'migration'
  | 'script'
  | 'sql';

/**
 * Who performed the change, as far as the ledger knows.
 *
 * `attributed` is false for rows the API could not attribute (uploads, the
 * public auth/invitation routes). The API says so explicitly instead of
 * emitting a blank name, so the UI renders "Sistema" rather than an empty slot.
 *
 * `isSupport` means the actor belonged to another company than the record.
 */
export type AuditActor = {
  username: string | null;
  role: string | null;
  isSupport: boolean;
  attributed: boolean;
};

/**
 * One changed column. `key` is the raw column name; `label` is what the API
 * suggests showing (today it equals `key` — labels are the SPA's job).
 *
 * `redacted: true` means the column's values were never stored, so `before` and
 * `after` are absent rather than null-because-empty. `resolved: false` means
 * the value is a foreign key whose target could not be labelled, and the raw
 * number is withheld rather than leaked.
 */
export type AuditDiffEntry = {
  key: string;
  label: string;
  before: unknown;
  after: unknown;
  redacted?: boolean;
  resolved?: boolean;
};

/** One ledger row as the client sees it. `diff` only when asked for. */
export type AuditRowView = {
  uuid: string;
  occurredAt: string;
  entityName: string;
  entityUuid: string | null;
  entityCode: string | null;
  entityDescription: string | null;
  operation: AuditOperation;
  action: string | null;
  source: AuditSourceValue;
  transactionRef: string;
  requestId: string | null;
  rootEntity: string | null;
  rootUuid: string | null;
  actor: AuditActor;
  changedKeys: string[];
  diff?: AuditDiffEntry[];
  /** `GET /audit-logs/:uuid` only: the whole snapshot, in the diff's shape. */
  beforeFields?: AuditDiffEntry[];
  afterFields?: AuditDiffEntry[];
  /** `{ ip, ua, route }`; `GET /audit-logs/:uuid` only. */
  context?: Record<string, unknown> | null;
};

/**
 * One transaction of a record's history: every row of one `txId` grouped
 * together, the record's own row first and its children after, so a save that
 * touched six child tables reads as one event.
 *
 * `truncated` is true when the transaction wrote more rows than the API's
 * per-entry cap (200) and the entry carries only the first page of them.
 *
 * `summary` is server-built Spanish naming Postgres tables; it is part of the
 * contract but the SPA composes its own headline and leaves this unrendered.
 */
export type HistoryEntry = {
  transactionRef: string;
  occurredAt: string;
  actor: AuditActor;
  action: string | null;
  summary: string;
  rows: AuditRowView[];
  truncated: boolean;
};

/**
 * The date window a read actually applied, echoed on the list response. A read
 * with neither a company nor a date bound is narrowed to the last 90 days by
 * the API, and the caller is told so rather than shown a silently short answer.
 * Both null means no date bound was applied.
 */
export type AuditWindow = {
  appliedFrom: string | null;
  appliedTo: string | null;
};

/** One row of `GET /audit-logs/entities` — the filter dropdown's contents. */
export type AuditEntity = {
  key: string;
  database: string;
  /** `audit.entities.<table>`; the API ships no i18n. */
  labelKey: string;
};

/**
 * Every filter `GET /audit-logs` (and `GET /audit-logs/export.csv`, which
 * validates identically) accepts. Anything not listed here is dropped silently
 * by the API's query builder, so it is not offered.
 */
export type AuditLogFilters = {
  entityName?: string;
  entityUuid?: string;
  rootUuid?: string;
  operation?: AuditOperation;
  action?: string;
  source?: AuditSourceValue;
  username?: string;
  requestId?: string;
  transactionRef?: string;
  /** ISO 8601 date or date-time. */
  from?: string;
  /** ISO 8601 date or date-time. */
  to?: string;
  /** A single raw column name; the API rejects it repeated. */
  changedKey?: string;
  search?: string;
};

/** The list endpoint's filters plus its pagination and `?include=diff`. */
export type AuditLogListParams = AuditLogFilters & {
  page?: number;
  /** Clamped to 100 by the client; the API caps it too. */
  limit?: number;
  /** Adds `diff` to every row (`?include=diff`). */
  includeDiff?: boolean;
};

/**
 * The list endpoint's result, already adapted to the SPA's paginator
 * (`totalCount` → `total`), plus the window the API says it applied.
 */
export type AuditLogListResult = PaginatedResponse<AuditRowView> & AuditWindow;

/** What a completed CSV export reports back to the page that asked for it. */
export type AuditCsvExport = {
  /** From `Content-Disposition`; the server names the file after its window. */
  fileName: string;
  /** `X-Export-Rows` — data lines, not counting the header. Null if absent. */
  rows: number | null;
  /** `X-Export-Truncated` — the 10 000-row cap bit and the file is partial. */
  truncated: boolean;
};
