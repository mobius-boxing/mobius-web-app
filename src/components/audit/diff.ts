import {
  AuditDiffEntry,
  AuditOperation,
  AuditRowView,
  HistoryEntry,
} from '../../types/audit';

/**
 * How a ledger row is turned into something a person can read.
 *
 * This module holds every decision about *what a diff says*, deliberately
 * apart from the components that lay it out: the drawer, the Historial tab and
 * the Auditoría page must all describe the same change the same way, and the
 * rules below are the ones that must never drift.
 *
 * The rules, in one place:
 *  - the noise keys never reach the screen, and never count towards a headline;
 *  - `redacted` and `resolved:false` are *statements*, not values, so they are
 *    returned as a different kind of thing than a before/after pair — a caller
 *    cannot accidentally render them as two empty cells;
 *  - an absent value is `<Vacío>` with a title saying which kind of absent it
 *    is, never a blank cell.
 */

/** The `t` this module needs. The real i18next `t` satisfies it. */
export type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * Columns the ledger records but nobody asked about. The API withholds their
 * values on purpose, so rendering them would put three permanently empty rows
 * under every creation and teach users that the drawer is broken.
 *
 * Matched case- and separator-insensitively because the schema is not
 * consistent: `warehouses` really does carry `created_at`/`updated_at` while
 * every other table carries `"createdAt"`/`"updatedAt"`.
 */
export const NOISE_KEYS = [
  'id',
  'uuid',
  'createdAt',
  'updatedAt',
  'legacyId',
] as const;

/** How many changed-field labels the collapsed entry line shows before `+N`. */
export const FIELD_PREVIEW_LIMIT = 3;

const normalizeKey = (key: string): string =>
  key.toLowerCase().replace(/[^a-z0-9]/g, '');

const NOISE = new Set(NOISE_KEYS.map(normalizeKey));

export const isNoiseKey = (key: string): boolean => NOISE.has(normalizeKey(key));

/**
 * True for a row that has nothing to say: empty on BOTH sides.
 *
 * A creation renders `capacity: <Vacío> → <Vacío>` for every column the record
 * left unset, which is the same defect as showing `createdAt` — rows that look
 * like data, carry none, and teach the reader that the drawer is broken. A
 * redacted or unresolved entry is never uninformative: it is a statement about
 * a value that DID change.
 */
const isEmptySide = (value: unknown): boolean =>
  value === null || value === undefined || value === '';

const isUninformative = (entry: AuditDiffEntry): boolean =>
  entry.redacted !== true &&
  entry.resolved !== false &&
  isEmptySide(entry.before) &&
  isEmptySide(entry.after);

/**
 * What may be shown of a diff: the bookkeeping columns and the rows that say
 * nothing, both gone. Everything that renders or counts a diff goes through
 * here, so a field cannot be hidden from the table but still counted in a
 * headline.
 */
export const filterNoise = (
  diff?: AuditDiffEntry[] | null
): AuditDiffEntry[] =>
  (diff ?? []).filter(
    (entry) => !isNoiseKey(entry.key) && !isUninformative(entry)
  );

export const filterNoiseKeys = (keys?: string[] | null): string[] =>
  (keys ?? []).filter((key) => !isNoiseKey(key));

/**
 * `audit.fields.<table>.<column>`, falling back to the raw column name.
 *
 * Only the tables people actually open are seeded (R-1). A missing label shows
 * `boxWidthMm`, which is honest and self-correcting; a guessed one is neither.
 */
export const fieldLabel = (
  entityKey: string,
  key: string,
  t: Translate
): string => t(`audit.fields.${entityKey}.${key}`, { defaultValue: key });

/** `audit.entities.<table>`, falling back to the raw table name. */
export const entityLabel = (entityKey: string, t: Translate): string =>
  t(`audit.entities.${entityKey}`, { defaultValue: entityKey });

export const operationLabel = (
  operation: AuditOperation,
  t: Translate
): string => t(`audit.operation.${operation}`, { defaultValue: operation });

/** One rendered value. `empty` is styling's business, not the reader's. */
export type DiffValueView = {
  text: string;
  /** Hover truth: the raw ISO string, the full untruncated text, or which
   *  flavour of empty this is. */
  title?: string;
  empty: boolean;
};

/** Enough of an ISO 8601 instant to be worth localising. */
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

/** Above this a value cell clamps to two lines, so it needs a hover title. */
const CLAMP_HINT_LENGTH = 40;

export const describeValue = (value: unknown, t: Translate): DiffValueView => {
  if (value === null || value === undefined) {
    return {
      text: t('audit.value.empty'),
      title: t('audit.value.emptyHint'),
      empty: true,
    };
  }

  if (typeof value === 'boolean') {
    return { text: value ? t('common.yes') : t('common.no'), empty: false };
  }

  if (typeof value === 'number') {
    return { text: String(value), empty: false };
  }

  if (typeof value === 'string') {
    // An empty string is a different fact than a null, and the reader of an
    // audit log is exactly the person who cares about the difference.
    if (value === '') {
      return {
        text: t('audit.value.empty'),
        title: t('audit.value.emptyStringHint'),
        empty: true,
      };
    }

    if (ISO_INSTANT.test(value)) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return { text: parsed.toLocaleString(), title: value, empty: false };
      }
    }

    // Only long text gets a title: a tooltip repeating a four-character code
    // is noise, but a clamped paragraph without one hides data.
    return {
      text: value,
      title: value.length > CLAMP_HINT_LENGTH ? value : undefined,
      empty: false,
    };
  }

  const json = JSON.stringify(value);
  return { text: json ?? String(value), title: json, empty: false };
};

/**
 * A diff row is either a before/after pair or a statement *about* the value.
 *
 * Keeping them different shapes is the whole point: `redacted` and
 * `resolved:false` arrive with `before` and `after` absent, so anything that
 * fell through to the value path would render two `<Vacío>`s — a lie about a
 * password change, and a guess about a foreign key.
 */
export type DiffRowView =
  | { kind: 'values'; before: DiffValueView; after: DiffValueView }
  | { kind: 'note'; text: string; title: string };

export const describeDiffEntry = (
  entry: AuditDiffEntry,
  t: Translate
): DiffRowView => {
  if (entry.redacted === true) {
    return {
      kind: 'note',
      text: t('audit.value.redacted'),
      title: t('audit.value.redactedHint'),
    };
  }

  if (entry.resolved === false) {
    return {
      kind: 'note',
      text: t('audit.value.unresolved'),
      title: t('audit.value.unresolvedHint'),
    };
  }

  return {
    kind: 'values',
    before: describeValue(entry.before, t),
    after: describeValue(entry.after, t),
  };
};

/** The record's own row: the API puts it first and its children after. */
export const primaryRow = (entry: HistoryEntry): AuditRowView | undefined =>
  entry.rows[0];

/**
 * The columns a row actually changed. `diff` when the caller asked for it,
 * `changedKeys` otherwise, noise filtered out of both.
 */
export const changedKeysOf = (row: AuditRowView): string[] =>
  row.diff ? filterNoise(row.diff).map((entry) => entry.key) : filterNoiseKeys(row.changedKeys);

/**
 * Every changed field of the whole transaction, the record's own row first and
 * its children after, each keeping the table it belongs to so it can be
 * labelled with that table's vocabulary.
 *
 * The headline counts THIS, not the record's own row: a route save that
 * changed one name and rewrote four stage tables is not "1 campo", and a
 * headline that says so under a body of 36 rows is a headline nobody will
 * trust again.
 */
export const changedFieldsOf = (
  entry: HistoryEntry
): { entityKey: string; key: string }[] =>
  entry.rows.flatMap((row) =>
    changedKeysOf(row).map((key) => ({ entityKey: row.entityName, key }))
  );

/** Child rows written in the same transaction as the record itself. */
export const relatedRowCount = (entry: HistoryEntry): number =>
  Math.max(0, entry.rows.length - 1);

/**
 * `Modificación · Depósito · 3 campos`, composed here rather than taken from
 * the server's `summary`, which is Spanish-only and names Postgres tables at
 * end users.
 *
 * The third segment measures the event, and what measures an event depends on
 * what happened to it:
 *
 *  - a **Modificación** is measured in fields, because the fields are what
 *    changed and the count is the reason to open the entry (children included:
 *    a route save that rewrote four stage tables is not "1 campo");
 *  - an **Alta** and a **Baja** are not. Every column of a new record is new
 *    by definition, so "Alta · Depósito · 28 campos" describes the width of
 *    the table rather than the size of the event. What the reader does not
 *    already know is whether the creation dragged other records in with it, so
 *    that is what the segment says — and nothing at all when it did not.
 */
export const headlineOf = (entry: HistoryEntry, t: Translate): string => {
  const row = primaryRow(entry);
  if (!row) return '';

  const parts = [
    operationLabel(row.operation, t),
    entityLabel(row.entityName, t),
  ];

  if (row.operation === 'Modificacion') {
    const count = changedFieldsOf(entry).length;
    if (count > 0) {
      parts.push(
        count === 1
          ? t('audit.headline.field', { count })
          : t('audit.headline.fields', { count })
      );
    }
  } else {
    const count = relatedRowCount(entry);
    if (count > 0) {
      parts.push(
        count === 1
          ? t('audit.headline.relatedRecord', { count })
          : t('audit.headline.relatedRecords', { count })
      );
    }
  }

  return parts.join(' · ');
};

/**
 * The third line: up to three field names, then how many changes are left.
 *
 * The names are de-duplicated — eight stage rows that all moved `sequence`
 * read as `Secuencia`, once — while `extra` counts CHANGES rather than names,
 * so the line agrees with the headline instead of quietly shrinking it.
 */
export const fieldPreviewOf = (
  entry: HistoryEntry,
  t: Translate
): { labels: string[]; extra: number } => {
  // Only a modification has fields worth naming here. On a creation the line
  // read `Empresa, Columnas de la grilla, Filas de la grilla +25`, which is
  // three arbitrary column names and a number, about a record whose every
  // column is new. The values are the interesting part, and they are one
  // click away.
  const row = primaryRow(entry);
  if (!row || row.operation !== 'Modificacion') return { labels: [], extra: 0 };

  const fields = changedFieldsOf(entry);

  const labels: string[] = [];
  fields.forEach(({ entityKey, key }) => {
    if (labels.length >= FIELD_PREVIEW_LIMIT) return;
    const label = fieldLabel(entityKey, key, t);
    if (!labels.includes(label)) labels.push(label);
  });

  return { labels, extra: Math.max(0, fields.length - labels.length) };
};

/** The same `toLocaleString` every list page uses, for the `title` attribute. */
export const absoluteTime = (iso: string): string => {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString();
};

/**
 * `hace 3 h`. Past the first month a relative time stops being useful — nobody
 * counts 47 days — so it becomes a date.
 */
export const relativeTime = (
  iso: string,
  t: Translate,
  now: number = Date.now()
): string => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;

  const minutes = Math.floor(Math.max(0, now - parsed.getTime()) / 60000);
  if (minutes < 1) return t('audit.time.now');
  if (minutes < 60) return t('audit.time.minutes', { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('audit.time.hours', { count: hours });

  const days = Math.floor(hours / 24);
  if (days <= 30) return t('audit.time.days', { count: days });

  return parsed.toLocaleDateString();
};
