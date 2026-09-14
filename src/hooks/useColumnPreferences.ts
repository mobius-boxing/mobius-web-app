import { useRef, useState } from 'react';
import type { Column } from '../components/ui/Table';
import { useAuthUser } from '../contexts/AuthContext';
import {
  ColumnPreference,
  clearColumnPrefs,
  hasDuplicateKeys,
  isHideable,
  mergeColumns,
  readColumnPrefs,
  writeColumnPrefs,
} from '../utils/columnPrefs';
import { logger } from '../utils/logger';

export interface ColumnState<T> {
  column: Column<T>;
  visible: boolean;
  hideable: boolean;
  pinned: boolean;
}

export interface UseColumnPreferencesResult<T> {
  /** Visible columns in effective order: what Table renders. */
  columns: Column<T>[];
  /** Every column in effective order, hidden included: what the chooser lists. */
  states: ColumnState<T>[];
  /** False when `listId` is absent or the column keys are not unique. */
  enabled: boolean;
  isCustomized: boolean;
  /** False when storage is unavailable, refused the last write, or no user is known. */
  isPersisted: boolean;
  setVisible: (key: string, visible: boolean) => void;
  move: (key: string, direction: -1 | 1) => void;
  reset: () => void;
}

type Layout = Pick<ColumnPreference, 'order' | 'hidden'>;

interface OwnedState {
  scope: string;
  pref: Layout | null;
  storageOk: boolean;
}

const load = (scope: string, userUuid: string | undefined, listId: string | undefined): OwnedState => {
  if (!userUuid || !listId) return { scope, pref: null, storageOk: true };
  const result = readColumnPrefs(userUuid, listId);
  return {
    scope,
    pref: result.status === 'loaded' ? result.pref : null,
    storageOk: result.status !== 'unavailable',
  };
};

export function useColumnPreferences<T>(
  listId: string | undefined,
  columns: Column<T>[]
): UseColumnPreferencesResult<T> {
  const userUuid = useAuthUser()?.uuid;
  const duplicates = hasDuplicateKeys(columns);
  const enabled = Boolean(listId) && !duplicates;
  const scope = `${userUuid ?? ''}:${enabled ? listId : ''}`;

  const warnedRef = useRef(false);
  if (listId && duplicates && !warnedRef.current) {
    warnedRef.current = true;
    logger.warn(`Table "${listId}" has duplicate column keys; column preferences are disabled`);
  }

  const [state, setState] = useState<OwnedState>(() =>
    load(scope, enabled ? userUuid : undefined, listId)
  );
  let current = state;
  // Derived-state reset: a new user or list id must never see, or write over,
  // the previous scope's layout — and embedded grids change listId via props
  // without remounting.
  if (state.scope !== scope) {
    current = load(scope, enabled ? userUuid : undefined, listId);
    setState(current);
  }

  // Setters read the newest state through a ref so two clicks inside one
  // render pass do not both start from the same snapshot.
  const latest = useRef(current);
  latest.current = current;

  const merged = mergeColumns(columns, enabled ? current.pref : null);
  const states: ColumnState<T>[] = merged.ordered.map((column) => ({
    column,
    visible: !merged.hidden.has(column.key),
    hideable: isHideable(column),
    pinned: Boolean(column.pinned),
  }));

  const commit = (next: Layout | null) => {
    const owned = latest.current;
    if (!enabled || owned.scope !== scope) return;
    let storageOk = owned.storageOk;
    if (userUuid && listId) {
      storageOk = next === null
        ? clearColumnPrefs(userUuid, listId)
        : writeColumnPrefs(userUuid, listId, next);
    }
    const updated: OwnedState = { scope, pref: next, storageOk };
    latest.current = updated;
    setState(updated);
  };

  const effective = () => {
    const now = mergeColumns(columns, latest.current.pref);
    return { order: now.ordered, hidden: new Set(now.hidden) };
  };

  const setVisible = (key: string, visible: boolean) => {
    const { order, hidden } = effective();
    const column = order.find((c) => c.key === key);
    if (!column || !isHideable(column) || hidden.has(key) === !visible) return;
    if (!visible && order.filter((c) => !hidden.has(c.key)).length <= 1) return;
    if (visible) hidden.delete(key);
    else hidden.add(key);
    commit({ order: order.map((c) => c.key), hidden: Array.from(hidden) });
  };

  const move = (key: string, direction: -1 | 1) => {
    const { order, hidden } = effective();
    const from = order.findIndex((c) => c.key === key);
    if (from === -1 || order[from].pinned) return;
    let to = from + direction;
    while (to >= 0 && to < order.length && order[to].pinned) to += direction;
    if (to < 0 || to >= order.length) return;
    const keys = order.map((c) => c.key);
    [keys[from], keys[to]] = [keys[to], keys[from]];
    commit({ order: keys, hidden: Array.from(hidden) });
  };

  const reset = () => commit(null);

  return {
    columns: states.filter((s) => s.visible).map((s) => s.column),
    states,
    enabled,
    isCustomized: enabled && current.pref !== null,
    isPersisted: enabled && Boolean(userUuid) && current.storageOk,
    setVisible,
    move,
    reset,
  };
}
