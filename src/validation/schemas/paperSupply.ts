import { z } from 'zod';
import {
  code,
  money,
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  requiredText,
  Translate,
} from '../fields';

/**
 * B5 supply schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   paper_supplies.code           varchar(100)  NOT NULL, UNIQUE ("companyId", code)
 *   paper_supplies.name           varchar(255)  NOT NULL
 *   paper_supplies.description    text          NULL
 *   paper_supplies.color          text          NULL
 *   paper_supplies.grammage       numeric(10,2) NULL
 *   paper_supplies.price          numeric(12,2) NULL  ← 12, not 10
 *   paper_supplies.minimumStock   jsonb         NULL  ← see below
 *   paper_supplies.{manufacturer,supplier,paperType,fscType}Id integer NULL (FK)
 *
 * `price` is `numeric(12,2)`, two digits wider than every other price in this
 * batch: 9999999999.99, not 99999999.99. Copying the stock ceiling here would
 * reject amounts the column stores.
 *
 * THE JSONB CASE, and why this schema has no `minimumStock` field: the column
 * is `jsonb`, and the modal composes it in `onSubmit` from TWO separate number
 * inputs — `minimumStockWeightKg` and `minimumStockDiameterMm` — into
 * `{ weightKg, diameterMm }`. So the rules belong on those two inputs, which
 * is what is registered and what the user actually types. Validating a
 * `minimumStock` key here would guard a field no one fills in, and shaping the
 * JSON stays the modal's job.
 *
 * Both parts are `double`-ish free numbers in the JSON document — jsonb has no
 * scale of its own — so they get a `>= 0` bound and no `decimals`.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 100;
const NAME_MAX = 255;
const TEXT_MAX = 10000;
/** numeric(10,2) */
const GRAMMAGE_MAX = 99999999.99;
/** numeric(12,2) — wider than every other price in this batch. */
const PRICE_MAX = 9999999999.99;

export const createPaperSupplySchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('paperSupplies.code')),
    name: requiredText(t, t('paperSupplies.name'), NAME_MAX),
    description: optionalText(
      t,
      t('paperSupplies.description'),
      TEXT_MAX
    ),
    color: optionalText(t, t('paperSupplies.color'), TEXT_MAX),
    manufacturerId: optionalSelect(),
    supplierId: optionalSelect(),
    paperTypeId: optionalSelect(),
    fscTypeId: optionalSelect(),
    grammage: nonNegativeNumber(t, t('paperSupplies.grammage'), {
      max: GRAMMAGE_MAX,
      decimals: 2,
    }),
    price: money(t, t('paperSupplies.price'), { max: PRICE_MAX }),
    // The two halves of the jsonb `minimumStock` document.
    minimumStockWeightKg: nonNegativeNumber(
      t,
      t('paperSupplies.minimumStockWeightKg')
    ),
    minimumStockDiameterMm: nonNegativeNumber(
      t,
      t('paperSupplies.minimumStockDiameterMm')
    ),
  });

export const editPaperSupplySchema = (t: Translate) =>
  createPaperSupplySchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('paperSupplies.code')),
      name: requiredText(t, t('paperSupplies.name'), NAME_MAX),
    });

export type CreatePaperSupplySchema = z.infer<
  ReturnType<typeof createPaperSupplySchema>
>;
