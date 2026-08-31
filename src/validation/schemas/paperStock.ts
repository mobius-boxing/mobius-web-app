import { z } from 'zod';
import {
  money,
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  requiredSelect,
  Translate,
} from '../fields';

/**
 * B5 stock schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   paper_stock.warehouseId         integer       NOT NULL (FK)
 *   paper_stock.paperSupplyId       integer       NOT NULL (FK)
 *   paper_stock.warehouseLocationId integer       NULL     (FK)
 *   paper_stock.supplierId          integer       NULL     (FK)
 *   paper_stock.manufacturerId      integer       NULL     (FK)
 *   paper_stock.comments            text          NULL
 *   paper_stock.price/weight/diameter/width  numeric(10,2) NULL
 *
 * FK required-ness comes from the COLUMN, not the modal (the B5 rule): the two
 * NOT NULL foreign keys are `requiredSelect`; the three nullable ones stay
 * optional.
 *
 * NAMING TRAP, deliberate: these `...Id` fields carry UUID STRINGS, not numbers
 * — the option values are `warehouse.uuid`. `PaperStockController.buildCreateDTO`
 * calls `resolveForeignKeys(req.body)` BEFORE constructing the DTO, so the wire
 * value is a uuid and the DTO sees an integer. That is why the client rule here
 * is `requiredSelect` (a string) while the server DTO validates an int.
 * Renaming the fields is a product change, out of scope for a validation batch.
 *
 * `warehouseLocationId` is NOT in this schema: the modal sets it from a
 * `WarehouseLocationSelectorModal` (`selectedLocation?.uuid`), never through
 * `register`, so a rule here would guard a field the form does not own.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

/** numeric(10,2) — shared by price and the three measures on this table. */
const NUMERIC_10_2_MAX = 99999999.99;
const COMMENTS_MAX = 10000;

const measure = (t: Translate, label: string) =>
  nonNegativeNumber(t, label, { max: NUMERIC_10_2_MAX, decimals: 2 });

export const createPaperStockSchema = (t: Translate) =>
  z.object({
    warehouseId: requiredSelect(t, t('paperStock.warehouse')),
    paperSupplyId: requiredSelect(t, t('paperStock.paperSupply')),
    supplierId: optionalSelect(),
    manufacturerId: optionalSelect(),
    weight: measure(t, t('paperStock.weight')),
    diameter: measure(t, t('paperStock.diameter')),
    width: measure(t, t('paperStock.width')),
    price: money(t, t('paperStock.price'), { max: NUMERIC_10_2_MAX }),
    comments: optionalText(t, t('paperStock.comments'), COMMENTS_MAX),
  });

/**
 * Edit keeps both NOT NULL foreign keys required: `.partial()` alone would let
 * a cleared select reach a NOT NULL column as null.
 */
export const editPaperStockSchema = (t: Translate) =>
  createPaperStockSchema(t)
    .partial()
    .extend({
      warehouseId: requiredSelect(t, t('paperStock.warehouse')),
      paperSupplyId: requiredSelect(t, t('paperStock.paperSupply')),
    });

export type CreatePaperStockSchema = z.infer<
  ReturnType<typeof createPaperStockSchema>
>;
