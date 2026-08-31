import { z } from 'zod';
import { code, nonNegativeNumber, optionalText, Translate } from '../fields';

/**
 * B4 lookup schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30), never from the modal's old inline rules (AMENDMENT A1):
 *   pallet_types.code        varchar(400) NULL, UNIQUE ("companyId", code)
 *   pallet_types.description text         NULL
 *   pallet_types.length/width/height/weight  double precision NULL
 *
 * REQUIRED-NESS CONFLICT, resolved the B2 way: `code` is NULLABLE in the column
 * but the modal has always sent it `required`, so the client rule is KEPT and
 * the gap documented rather than widened. Same follow-up NOT NULL card as
 * `delivery_zones.code` / `fsc_types.code`.
 *
 * THE FLOAT DETAIL (L-010): the four measures are `double precision`, not
 * `numeric(p,s)`. Procusto parity keeps float columns float, so there is no
 * scale to enforce — passing `decimals` here would invent a constraint the
 * database does not have and reject values Procusto accepts. Bound is `>= 0`
 * only, which is the one thing every measure in this schema shares.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 400;
const DESCRIPTION_MAX = 10000;

/** No `max`/`decimals`: `double precision` has neither (L-010). */
const measure = (t: Translate, label: string) => nonNegativeNumber(t, label);

export const createPalletTypeSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('palletTypes.code')),
    description: optionalText(t, t('palletTypes.description'), DESCRIPTION_MAX),
    length: measure(t, t('palletTypes.length')),
    width: measure(t, t('palletTypes.width')),
    height: measure(t, t('palletTypes.height')),
    weight: measure(t, t('palletTypes.weight')),
  });

/** `code` is re-stated so `.partial()` cannot let the user blank it. */
export const editPalletTypeSchema = (t: Translate) =>
  createPalletTypeSchema(t)
    .partial()
    .extend({ code: code(t, CODE_MAX, t('palletTypes.code')) });

export type CreatePalletTypeSchema = z.infer<
  ReturnType<typeof createPalletTypeSchema>
>;
