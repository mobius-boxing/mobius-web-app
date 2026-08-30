import { z } from 'zod';
import {
  code,
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  positiveInt,
  requiredText,
  Translate,
} from '../fields';

/**
 * B5 supply schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   paper_sheets.code           varchar(255)  NOT NULL
 *   paper_sheets.name           varchar(255)  NOT NULL
 *   paper_sheets.description    text          NULL
 *   paper_sheets.supplierId     integer       NULL (FK)
 *   paper_sheets.manufacturerId integer       NULL (FK)
 *   paper_sheets.corrugationId  integer       NULL (FK)
 *   paper_sheets.length/width   numeric(10,2) NULL
 *   paper_sheets.minimumStock   integer       NULL, default 0
 *
 * A FIFTH distinct `code` width (255) after 50 / 100 / 400 / 255 — per-table,
 * never a shared constant.
 *
 * `minimumStock` here is a plain `integer` with a default, unlike
 * `consumableSupply`'s `numeric(14,4)` and `paperSupply`'s `jsonb`. Three
 * entities, three different types behind one field name: `positiveInt`, and a
 * blank omits the key so the default applies rather than writing an explicit 0.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 255;
const NAME_MAX = 255;
const DESCRIPTION_MAX = 10000;
/** numeric(10,2) */
const MEASURE_MAX = 99999999.99;

export const createPaperSheetSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('paperSheets.code')),
    name: requiredText(t, t('paperSheets.name'), NAME_MAX),
    description: optionalText(t, t('paperSheets.description'), DESCRIPTION_MAX),
    supplierId: optionalSelect(),
    manufacturerId: optionalSelect(),
    corrugationId: optionalSelect(),
    length: nonNegativeNumber(t, t('paperSheets.length'), {
      max: MEASURE_MAX,
      decimals: 2,
    }),
    width: nonNegativeNumber(t, t('paperSheets.width'), {
      max: MEASURE_MAX,
      decimals: 2,
    }),
    minimumStock: positiveInt(t, t('paperSheets.minimumStock')),
  });

export const editPaperSheetSchema = (t: Translate) =>
  createPaperSheetSchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('paperSheets.code')),
      name: requiredText(t, t('paperSheets.name'), NAME_MAX),
    });

export type CreatePaperSheetSchema = z.infer<
  ReturnType<typeof createPaperSheetSchema>
>;
