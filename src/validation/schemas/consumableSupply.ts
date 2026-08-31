import { z } from 'zod';
import {
  code,
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  requiredSelect,
  requiredText,
  Translate,
} from '../fields';

/**
 * B5 supply schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   consumable_supplies.code             varchar(255)  NOT NULL
 *   consumable_supplies.name             varchar(255)  NOT NULL
 *   consumable_supplies.description      text          NULL
 *   consumable_supplies.location         text          NULL
 *   consumable_supplies.expiry           text          NULL  ← text, NOT date
 *   consumable_supplies.minimumStock     numeric(14,4) NULL
 *   consumable_supplies.{consumableType,manufacturer,supplier,color}Id integer NULL (FK)
 *
 * THE `expiry` TRAP: the column is `text`, not `date`, and the modal renders a
 * plain text Input for it. `dateDDMMYYYY` would be the obvious primitive and it
 * is the WRONG one — it normalises to ISO and rejects anything unparseable,
 * which would refuse every free-form value the column holds today ("Lote 2027",
 * "sin vencimiento") and silently rewrite the format of the rest. It is
 * `optionalText` until someone decides the column should be a date, which is a
 * product change and a migration, not a validation batch.
 *
 * REQUIRED-NESS CONFLICT on `consumableTypeUuid`, resolved the B2 way: the
 * `consumableTypeId` column is NULLABLE, but the modal has always marked the
 * select `required` (label carries the `*`) and `CreateConsumableSupplyForm`
 * declares it `string`, not `string | undefined`. The stricter existing UI rule
 * is KEPT — a batch changes what a form checks, never what it accepts — and the
 * gap goes on the same follow-up NOT NULL card as `delivery_zones.code`.
 * The other three FKs are nullable AND ruleless, so they stay optional.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 255;
const NAME_MAX = 255;
const TEXT_MAX = 10000;
/** numeric(14,4) */
const STOCK_MAX = 9999999999.9999;

export const createConsumableSupplySchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('consumableSupplies.code')),
    name: requiredText(t, t('consumableSupplies.name'), NAME_MAX),
    description: optionalText(
      t,
      t('consumableSupplies.description'),
      TEXT_MAX
    ),
    location: optionalText(t, t('consumableSupplies.location'), TEXT_MAX),
    // `text` column, free-form on purpose — see the header.
    expiry: optionalText(t, t('consumableSupplies.expiry'), TEXT_MAX),
    consumableTypeUuid: requiredSelect(
      t,
      t('consumableSupplies.consumableType')
    ),
    manufacturerUuid: optionalSelect(),
    supplierUuid: optionalSelect(),
    colorUuid: optionalSelect(),
    minimumStock: nonNegativeNumber(
      t,
      t('consumableSupplies.minimumStock'),
      { max: STOCK_MAX, decimals: 4 }
    ),
  });

export const editConsumableSupplySchema = (t: Translate) =>
  createConsumableSupplySchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('consumableSupplies.code')),
      name: requiredText(t, t('consumableSupplies.name'), NAME_MAX),
      consumableTypeUuid: requiredSelect(
        t,
        t('consumableSupplies.consumableType')
      ),
    });

export type CreateConsumableSupplySchema = z.infer<
  ReturnType<typeof createConsumableSupplySchema>
>;
