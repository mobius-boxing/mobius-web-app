import { z } from 'zod';
import { code, requiredText, Translate } from '../fields';

/**
 * B2 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   box_types.code varchar(50) NOT NULL, UNIQUE (code, companyId)
 *   box_types.name varchar(255) NOT NULL
 *   (this table has NO `description` column — it is code+name)
 *
 * `companyId` (NOT NULL here) is injected by the API from the caller's
 * token and is never a form field (L-009).
 *
 * `box_types` is code+NAME, not the code+description the batch brief assumed —
 * one of the per-table facts that defeat templating this sweep.
 */

const CODE_MAX = 50;
const NAME_MAX = 255;

export const createBoxTypeSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('boxTypes.code')),
    name: requiredText(t, t('boxTypes.name'), NAME_MAX),
  });

/**
 * Both columns are `notNullable` and the Edit modal `reset()`s both from the
 * row, so the create rules apply unchanged; re-stating them after `.partial()`
 * keeps a blanked field from reaching a NOT NULL violation.
 */
export const editBoxTypeSchema = (t: Translate) =>
  createBoxTypeSchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('boxTypes.code')),
      name: requiredText(t, t('boxTypes.name'), NAME_MAX),
    });

export type CreateBoxTypeSchema = z.infer<
  ReturnType<typeof createBoxTypeSchema>
>;
