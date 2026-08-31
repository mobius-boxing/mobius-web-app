import { z } from 'zod';
import {
  money,
  optionalSelect,
  optionalText,
  positiveInt,
  requiredSelect,
  Translate,
} from '../fields';

/**
 * B5 stock schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   tooling_stock.warehouseId    integer       NOT NULL (FK)
 *   tooling_stock.toolingId   integer       NOT NULL (FK)
 *   tooling_stock.supplierId     integer       NULL     (FK)
 *   tooling_stock.manufacturerId integer       NULL     (FK)
 *   tooling_stock.quantity       integer       NOT NULL, default 0
 *   tooling_stock.price          numeric(10,2) NULL
 *   tooling_stock.comments       text          NULL
 *
 * NAMING: unlike `paperStock`/`sheetStock`, this form uses the `...Uuid`
 * convention and its controller resolves the foreign keys AFTER `build()`, so
 * the DTO validates uuids rather than integers. The client rule is the same
 * either way — a select is a string on both paths.
 *
 * QUANTITY: NOT NULL *with* a default, so the column alone would make it
 * optional; the modal has always sent it `required`, and the governing
 * principle keeps the stricter existing rule. Its `valueAsNumber: true` goes
 * with the rule object on purpose — that flag is what produced `NaN` from an
 * emptied box.
 *
 * `warehouseLocationUuid` is set by the location picker, not by `register`, so
 * it carries no rule here.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const PRICE_MAX = 99999999.99;
const QUANTITY_MAX = 2147483647;
const COMMENTS_MAX = 10000;

export const createToolingStockSchema = (t: Translate) =>
  z.object({
    warehouseUuid: requiredSelect(t, t('toolingStock.warehouse')),
    toolingUuid: requiredSelect(t, t('toolingStock.tooling')),
    supplierUuid: optionalSelect(),
    manufacturerUuid: optionalSelect(),
    quantity: positiveInt(t, t('toolingStock.quantity'), {
      max: QUANTITY_MAX,
      required: true,
    }),
    price: money(t, t('toolingStock.price'), { max: PRICE_MAX }),
    comments: optionalText(t, t('toolingStock.comments'), COMMENTS_MAX),
  });

/**
 * Edit keeps both NOT NULL foreign keys required: `.partial()` alone would let
 * a cleared select reach a NOT NULL column as null.
 */
export const editToolingStockSchema = (t: Translate) =>
  createToolingStockSchema(t)
    .partial()
    .extend({
      warehouseUuid: requiredSelect(t, t('toolingStock.warehouse')),
      toolingUuid: requiredSelect(t, t('toolingStock.tooling')),
      // Re-stated after `.partial()`: the column is NOT NULL and the modal has
      // always marked it required, so an edit that blanks it must fail here
      // rather than reach the column as null.
      quantity: positiveInt(t, t('toolingStock.quantity'), {
        max: QUANTITY_MAX,
        required: true,
      }),
    });

export type CreateToolingStockSchema = z.infer<
  ReturnType<typeof createToolingStockSchema>
>;
