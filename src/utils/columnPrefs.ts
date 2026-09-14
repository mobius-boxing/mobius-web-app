import type { Column } from '../components/ui/Table';
import { logger } from './logger';

export const COLUMN_PREFS_PREFIX = 'column_prefs';
export const COLUMN_PREFS_VERSION = 1 as const;

export interface ColumnPreference {
  v: typeof COLUMN_PREFS_VERSION;
  order: string[];
  hidden: string[];
  updatedAt: string;
}

export type ReadResult =
  | { status: 'absent' }
  | { status: 'loaded'; pref: ColumnPreference }
  | { status: 'unsupported' }
  | { status: 'unavailable' };

export interface EffectiveColumns<T> {
  ordered: Column<T>[];
  hidden: ReadonlySet<string>;
}

export const columnPrefsKey = (userUuid: string, listId: string): string =>
  `${COLUMN_PREFS_PREFIX}:${userUuid}:${listId}`;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const readColumnPrefs = (userUuid: string, listId: string): ReadResult => {
  const key = columnPrefsKey(userUuid, listId);
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return { status: 'unavailable' };
  }
  if (raw === null) return { status: 'absent' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const candidate = parsed as Record<string, unknown>;
    // A newer frontend (another tab, or a rollback) may have written this:
    // leave it for that version instead of destroying it on read.
    if (typeof candidate.v === 'number' && candidate.v !== COLUMN_PREFS_VERSION) {
      return { status: 'unsupported' };
    }
    if (
      candidate.v === COLUMN_PREFS_VERSION &&
      isStringArray(candidate.order) &&
      isStringArray(candidate.hidden)
    ) {
      return {
        status: 'loaded',
        pref: {
          v: COLUMN_PREFS_VERSION,
          order: candidate.order,
          hidden: candidate.hidden,
          updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : '',
        },
      };
    }
  }

  logger.warn(`Discarding malformed column preferences at "${key}"`);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage that refuses the removal will refuse the next read too.
  }
  return { status: 'absent' };
};

export const writeColumnPrefs = (
  userUuid: string,
  listId: string,
  pref: Pick<ColumnPreference, 'order' | 'hidden'>
): boolean => {
  const payload: ColumnPreference = {
    v: COLUMN_PREFS_VERSION,
    order: pref.order,
    hidden: pref.hidden,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(columnPrefsKey(userUuid, listId), JSON.stringify(payload));
    return true;
  } catch (error) {
    logger.warn('Column preferences could not be saved', error);
    return false;
  }
};

export const clearColumnPrefs = (userUuid: string, listId: string): boolean => {
  try {
    window.localStorage.removeItem(columnPrefsKey(userUuid, listId));
    return true;
  } catch (error) {
    logger.warn('Column preferences could not be cleared', error);
    return false;
  }
};

export const isHideable = <T,>(column: Column<T>): boolean =>
  !column.pinned && column.hideable !== false;

export const hasDuplicateKeys = <T,>(columns: Column<T>[]): boolean =>
  new Set(columns.map((column) => column.key)).size !== columns.length;

const withOneVisible = <T,>(ordered: Column<T>[], hidden: Set<string>): EffectiveColumns<T> => {
  if (ordered.length > 0 && ordered.every((column) => hidden.has(column.key))) {
    hidden.delete(ordered[0].key);
  }
  return { ordered, hidden };
};

/**
 * Pure. `code` is the array the page built this render, so a column gated away
 * by a permission is absent here and can never be resurrected from storage.
 */
export function mergeColumns<T>(
  code: Column<T>[],
  pref: Pick<ColumnPreference, 'order' | 'hidden'> | null
): EffectiveColumns<T> {
  if (code.length === 0) return { ordered: [], hidden: new Set() };

  if (pref === null || hasDuplicateKeys(code)) {
    const hidden = new Set(
      code.filter((column) => column.defaultHidden && isHideable(column)).map((column) => column.key)
    );
    return withOneVisible([...code], hidden);
  }

  const byKey = new Map(code.map((column) => [column.key, column]));
  const prefOrder = Array.from(new Set(pref.order)).filter((key) => byKey.has(key));
  const prefKnown = new Set(prefOrder);
  const prefHidden = new Set(pref.hidden);

  const movable = code.filter((column) => !column.pinned);
  const movableKeys = new Set(movable.map((column) => column.key));
  const seq = prefOrder.filter((key) => movableKeys.has(key));

  movable.forEach((column, index) => {
    if (seq.includes(column.key)) return;
    let insertAt = 0;
    for (let i = index - 1; i >= 0; i--) {
      const anchor = seq.indexOf(movable[i].key);
      if (anchor !== -1) {
        insertAt = anchor + 1;
        break;
      }
    }
    seq.splice(insertAt, 0, column.key);
  });

  let next = 0;
  const ordered = code.map((column) =>
    column.pinned ? column : (byKey.get(seq[next++]) as Column<T>)
  );

  // A key the saved preference has never seen is a column added since the
  // save: it shows even when defaultHidden, or nobody would ever discover it.
  const hidden = new Set(
    movable
      .filter(
        (column) => isHideable(column) && prefKnown.has(column.key) && prefHidden.has(column.key)
      )
      .map((column) => column.key)
  );

  return withOneVisible(ordered, hidden);
}
