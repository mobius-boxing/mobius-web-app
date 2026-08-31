import { z } from 'zod';
import { boolean, code, requiredText, Translate } from '../fields';

/**
 * B3 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   consumable_types.code            varchar(255) NOT NULL, NO unique index
 *   consumable_types.name            varchar(255) NOT NULL
 *   consumable_types.autoConsumption boolean      NULL, default false
 *
 * `companyId` (NOT NULL here) is injected by the API from the caller's token
 * and is never a form field (L-009).
 *
 * SIGN-OFF (2026-08-29): the `code` column is varchar(255) — a FOURTH distinct
 * code width in this codebase (50 / 100 / 255 / 400) — but the form has always
 * capped at 50. The column width is the CEILING, not the target: widening the
 * cap would be a product regression, so 50 stays and the gap is documented, not
 * closed. Code lengths here are per-table; never a shared constant.
 *
 * Schema surprise worth knowing when reading a 23505: this table's `code` has
 * NO unique constraint at all, unlike every other code column swept so far, so
 * duplicate codes are physically possible and no server error will fire.
 */

/** The UI's long-standing cap; the column itself is varchar(255). */
const CODE_MAX = 50;
const NAME_MAX = 255;

export const createConsumableTypeSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('consumableTypes.code')),
    name: requiredText(t, t('consumableTypes.name'), NAME_MAX),
    autoConsumption: boolean(),
  });

/**
 * Both text columns are `notNullable` and the Edit modal `reset()`s both from
 * the row, so the create rules apply unchanged; re-stating them after
 * `.partial()` keeps a blanked field from reaching a NOT NULL violation.
 */
export const editConsumableTypeSchema = (t: Translate) =>
  createConsumableTypeSchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('consumableTypes.code')),
      name: requiredText(t, t('consumableTypes.name'), NAME_MAX),
    });

export type CreateConsumableTypeSchema = z.infer<
  ReturnType<typeof createConsumableTypeSchema>
>;
