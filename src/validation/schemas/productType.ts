import { z } from 'zod';
import { code, requiredText, Translate } from '../fields';

/**
 * B2 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   product_types.code varchar(50) NOT NULL, UNIQUE (code, companyId)
 *   product_types.name varchar(255) NOT NULL
 *   (this table has NO `description` column — it is code+name)
 *
 * `companyId` (NOT NULL here) is injected by the API from the caller's
 * token and is never a form field (L-009).
 *
 * Same code+name shape as `box_types`: no `description` column exists.
 */

const CODE_MAX = 50;
const NAME_MAX = 255;

export const createProductTypeSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('productTypes.code')),
    name: requiredText(t, t('productTypes.name'), NAME_MAX),
  });

/**
 * Both columns are `notNullable` and the Edit modal `reset()`s both from the
 * row, so the create rules apply unchanged; re-stating them after `.partial()`
 * keeps a blanked field from reaching a NOT NULL violation.
 */
export const editProductTypeSchema = (t: Translate) =>
  createProductTypeSchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('productTypes.code')),
      name: requiredText(t, t('productTypes.name'), NAME_MAX),
    });

export type CreateProductTypeSchema = z.infer<
  ReturnType<typeof createProductTypeSchema>
>;
