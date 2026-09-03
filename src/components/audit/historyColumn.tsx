import React from 'react';
import { Translate } from './diff';
import HistoryButton from './HistoryButton';

/**
 * The history column, as one expression a page can spread into its `columns`
 * array.
 *
 * The cost of adding history to a list page is the ceiling on how many pages
 * will ever have it, so this helper carries everything: the header, the width,
 * the button and the drawer's open state (which lives inside `HistoryButton`).
 * A page gains one import and one line, and keeps no state, no handler and no
 * drawer import — which is also why 43 pages can be edited mechanically
 * without 43 chances to get the wiring wrong.
 *
 *   const columns = [
 *     ...,
 *     historyColumn('warehouses', t),
 *     { key: 'actions', ... },
 *   ];
 *
 * `entityKey` is the snake_case **table** name (`sales_orders`), never the page
 * name and never a label: it is what the API keys its ledger by.
 */

/** The shape `components/ui/Table.tsx` consumes (its `Column` is not exported). */
export interface HistoryColumn<T = any> {
  key: string;
  header: string;
  className?: string;
  render: (value: any, row: T) => React.ReactNode;
}

/**
 * Rows the pages hand us. `uuid` is the only field this column needs; the rest
 * are read, when present, to name the record in the drawer's header.
 */
type HistoryRow = {
  uuid?: string | null;
  code?: unknown;
  number?: unknown;
  name?: unknown;
  description?: unknown;
};

/**
 * The first identifier the row happens to carry, in the order a person would
 * recognise the record by: its business code, its order number, its name, and
 * only then its description.
 *
 * It has to be one expression for all 43 surfaces — a per-page label would
 * defeat the point of the helper — so it reads only fields whose meaning is
 * the same everywhere, and returns nothing when the row carries none of them.
 * The drawer then shows its title alone, which is what it did before: with the
 * sheet covering a 390px viewport, no label is honest and a wrong one is not.
 */
const recordLabelOf = (row: HistoryRow | null | undefined): string | undefined => {
  const candidates = [row?.code, row?.number, row?.name, row?.description];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return undefined;
};

export function historyColumn<T extends HistoryRow = any>(
  entityKey: string,
  t: Translate
): HistoryColumn<T> {
  return {
    key: 'history',
    header: t('audit.title'),
    className: 'w-16',
    render: (_value: any, row: T) => (
      <HistoryButton
        entityKey={entityKey}
        uuid={row?.uuid}
        recordLabel={recordLabelOf(row)}
      />
    ),
  };
}

export default historyColumn;
