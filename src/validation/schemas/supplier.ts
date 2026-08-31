import { z } from 'zod';
import { boolean, code, Translate } from '../fields';

/**
 * B4 lookup schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   suppliers.code                varchar(100) NOT NULL, UNIQUE (code) — GLOBAL
 *   suppliers.suppliesSheets      boolean NULL, default false
 *   suppliers.suppliesElaborated  boolean NULL, default false
 *   suppliers.suppliesConsumables boolean NULL, default false
 *   suppliers.suppliesPaper       boolean NULL, default false
 *   suppliers.suppliesTooling     boolean NULL, default false
 *
 * `code` is varchar(100) — the `manufacturers` width, a third distinct one in
 * this sweep. Per-table, never a shared constant.
 *
 * The unique index is GLOBAL, not `(companyId, code)`, so a 23505 raised here
 * is cross-tenant: another company already owns that code. Worth knowing when
 * reading the server error; uniqueness stays the server's job (non-goal).
 *
 * The five `supplies*` flags are the whole rest of this form; `boolean()` maps
 * an unticked box to `undefined` rather than `false` so the column default
 * applies instead of an explicit write.
 */

const CODE_MAX = 100;

export const createSupplierSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('suppliers.code')),
    suppliesSheets: boolean(),
    suppliesElaborated: boolean(),
    suppliesConsumables: boolean(),
    suppliesPaper: boolean(),
    suppliesTooling: boolean(),
  });

export const editSupplierSchema = (t: Translate) =>
  createSupplierSchema(t)
    .partial()
    .extend({ code: code(t, CODE_MAX, t('suppliers.code')) });

export type CreateSupplierSchema = z.infer<
  ReturnType<typeof createSupplierSchema>
>;
