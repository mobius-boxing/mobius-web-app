import { z } from 'zod';
import { positiveInt, requiredText, Translate } from '../fields';

/**
 * B3 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   warehouses.name      varchar(255) NOT NULL
 *   warehouses.gridRows  integer      NOT NULL, default 10 (precision 32, scale 0)
 *   warehouses.gridCols  integer      NOT NULL, default 10 (precision 32, scale 0)
 *   warehouses.companyId integer      NOT NULL
 *
 * `companyId` is injected by the API from the caller's token and is never a
 * form field (L-009).
 *
 * SIGN-OFF (2026-08-29) on the two numerics: both are PLAIN `integer` columns
 * with ZERO CHECK constraints, so Postgres would take any int32. The 1..50
 * bound is a pure PRODUCT rule that predates this batch (the Create modal and
 * `WarehouseGridEditorModal` both enforce it), and it is KEPT verbatim — it is
 * NOT "corrected" to the int32 range, because a batch changes what a form
 * checks, never what it accepts.
 *
 * Weak real-data coverage, flagged deliberately: all 46 live warehouses are
 * 5x5, so no existing row exercises either edge of 1..50.
 *
 * `name` had NO length rule at all before this batch (just `required`), so the
 * 255 cap is the one genuine tightening here.
 */

const NAME_MAX = 255;
/** Product rule, not a DB constraint: the column is an unbounded `integer`. */
const GRID_MIN = 1;
const GRID_MAX = 50;

const gridSize = (t: Translate, label: string) =>
  positiveInt(t, label, { min: GRID_MIN, max: GRID_MAX, required: true });

export const createWarehouseSchema = (t: Translate) =>
  z.object({
    name: requiredText(t, t('warehouses.name'), NAME_MAX),
    gridRows: gridSize(t, t('warehouses.gridRows')),
    gridCols: gridSize(t, t('warehouses.gridCols')),
  });

/**
 * The Edit modal renders ONLY `name` — resizing the grid is routed to
 * `WarehouseGridEditorModal` (B7), which talks to the same `PUT /warehouse`.
 * `.partial()` therefore leaves `gridRows`/`gridCols` absent-but-bounded rather
 * than dropping the rule, so the two doors into those columns cannot disagree.
 * `name` is re-stated because `.partial()` alone would let the user blank a
 * `notNullable` column.
 */
export const editWarehouseSchema = (t: Translate) =>
  createWarehouseSchema(t)
    .partial()
    .extend({ name: requiredText(t, t('warehouses.name'), NAME_MAX) });

/**
 * The grid dimensions alone, for `WarehouseGridEditorModal` (B7, pattern B).
 *
 * That modal hard-coded `< 1 || > 50` in its resize handler — the same product
 * rule this file already owned, written a second time. Two copies of one bound
 * is how they drift, so the modal now calls this and the number lives here
 * only. Its own "dimensions unchanged" check stays where it is: that is a
 * no-op guard, not a validation rule.
 */
export const warehouseGridSchema = (t: Translate) =>
  z.object({
    gridRows: gridSize(t, t('warehouses.gridRows')),
    gridCols: gridSize(t, t('warehouses.gridCols')),
  });

export type CreateWarehouseSchema = z.infer<
  ReturnType<typeof createWarehouseSchema>
>;
