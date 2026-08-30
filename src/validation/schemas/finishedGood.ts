import { z } from 'zod';
import {
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  requiredText,
  Translate,
} from '../fields';

/**
 * B4 lookup schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   finished_goods.code           varchar(400) NULL
 *   finished_goods.name           varchar(400) NOT NULL
 *   finished_goods.description    text         NULL
 *   finished_goods.supplierId     integer      NULL (FK)
 *   finished_goods.manufacturerId integer      NULL (FK)
 *   finished_goods.minimumStock   numeric(14,4) NULL
 *
 * `code` is the rare one that is nullable in the column AND ruleless in the
 * modal, so the two already agree: it stays optional. No conflict to resolve
 * and nothing to tighten beyond the 400-char ceiling.
 *
 * `minimumStock` is `numeric(14,4)`: 10 digits before the point, 4 after, hence
 * 9999999999.9999 and `decimals: 4`. The modal's `data.minimumStock ? Number(x)`
 * block is deleted with this schema — note it also swallowed a deliberate `0`,
 * which the schema now passes through. Blank still omits the key entirely so
 * the column default applies (per the brief: never send 0 for an empty field).
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 400;
const NAME_MAX = 400;
const DESCRIPTION_MAX = 10000;
/** numeric(14,4) */
const STOCK_MAX = 9999999999.9999;
const STOCK_DECIMALS = 4;

export const createFinishedGoodSchema = (t: Translate) =>
  z.object({
    code: optionalText(t, t('finishedGoods.code'), CODE_MAX),
    name: requiredText(t, t('finishedGoods.name'), NAME_MAX),
    description: optionalText(
      t,
      t('finishedGoods.description'),
      DESCRIPTION_MAX
    ),
    supplierUuid: optionalSelect(),
    manufacturerUuid: optionalSelect(),
    minimumStock: nonNegativeNumber(t, t('finishedGoods.minimumStock'), {
      max: STOCK_MAX,
      decimals: STOCK_DECIMALS,
    }),
  });

export const editFinishedGoodSchema = (t: Translate) =>
  createFinishedGoodSchema(t)
    .partial()
    .extend({ name: requiredText(t, t('finishedGoods.name'), NAME_MAX) });

export type CreateFinishedGoodSchema = z.infer<
  ReturnType<typeof createFinishedGoodSchema>
>;
