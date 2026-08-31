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
 *   sheet_stock.warehouseId    integer       NOT NULL (FK)
 *   sheet_stock.paperSheetId   integer       NOT NULL (FK)
 *   sheet_stock.supplierId     integer       NULL     (FK)
 *   sheet_stock.manufacturerId integer       NULL     (FK)
 *   sheet_stock.quantity       integer       NOT NULL, default 0
 *   sheet_stock.price          numeric(10,2) NULL
 *   sheet_stock.comments       text          NULL
 *
 * Same `...Id`-carries-a-uuid trap as `paperStock` — see that file.
 *
 * QUANTITY, and why it is required: the column is NOT NULL *with a default*,
 * which by the brief's table would make it optional. The modal has always sent
 * it `required`, and the governing principle keeps the stricter existing UI
 * rule. So `required: true` stays and the discrepancy is recorded here rather
 * than silently resolved either way.
 *
 * Dropping the modal's `valueAsNumber: true` alongside the rule object is
 * intentional, not collateral: it is what turned an emptied quantity box into
 * `NaN`. The schema's preprocessing maps `''` to undefined before coercion.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const PRICE_MAX = 99999999.99;
const QUANTITY_MAX = 2147483647;
const COMMENTS_MAX = 10000;

export const createSheetStockSchema = (t: Translate) =>
  z.object({
    warehouseId: requiredSelect(t, t('sheetStock.warehouse')),
    paperSheetId: requiredSelect(t, t('sheetStock.paperSheet')),
    supplierId: optionalSelect(),
    manufacturerId: optionalSelect(),
    quantity: positiveInt(t, t('sheetStock.quantity'), {
      max: QUANTITY_MAX,
      required: true,
    }),
    price: money(t, t('sheetStock.price'), { max: PRICE_MAX }),
    comments: optionalText(t, t('sheetStock.comments'), COMMENTS_MAX),
  });

export const editSheetStockSchema = (t: Translate) =>
  createSheetStockSchema(t)
    .partial()
    .extend({
      warehouseId: requiredSelect(t, t('sheetStock.warehouse')),
      paperSheetId: requiredSelect(t, t('sheetStock.paperSheet')),
      // Re-stated after `.partial()`: the column is NOT NULL and the modal has
      // always marked it required, so an edit that blanks it must fail here
      // rather than reach the column as null.
      quantity: positiveInt(t, t('sheetStock.quantity'), {
        max: QUANTITY_MAX,
        required: true,
      }),
    });

export type CreateSheetStockSchema = z.infer<
  ReturnType<typeof createSheetStockSchema>
>;
