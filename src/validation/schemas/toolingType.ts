import { z } from 'zod';
import { boolean, code, optionalText, requiredText, Translate } from '../fields';

/**
 * B3 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   tooling_types.code                 varchar(50)  NOT NULL, UNIQUE (code)
 *   tooling_types.name                 varchar(255) NOT NULL
 *   tooling_types.description          text         NULL
 *   tooling_types.automaticConsumption boolean      NULL, default false
 *
 * `companyId` (NOT NULL here) is injected by the API from the caller's token
 * and is never a form field (L-009).
 *
 * The unique index on `code` is GLOBAL, not `(companyId, code)` — a 23505 from
 * this table is cross-tenant, same as `manufacturers` / `paper_types` in B2.
 *
 * `description` carried NO rule at all before this batch: a free textarea into
 * a `text` column. The 10000 cap is the project-wide convention the B1 pilot
 * set for nullable `text`; the longest live value is 40 characters.
 */

const CODE_MAX = 50;
const NAME_MAX = 255;
/** `text` has no width, so this is the project-wide cap the B1 pilot set. */
const DESCRIPTION_MAX = 10000;

export const createToolingTypeSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('toolingTypes.code')),
    name: requiredText(t, t('toolingTypes.name'), NAME_MAX),
    description: optionalText(t, t('toolingTypes.description'), DESCRIPTION_MAX),
    automaticConsumption: boolean(),
  });

/**
 * The Edit modal renders and `reset()`s every field, so the create rules apply
 * unchanged; `code` and `name` are re-stated because `.partial()` alone would
 * let the user blank a `notNullable` column.
 */
export const editToolingTypeSchema = (t: Translate) =>
  createToolingTypeSchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('toolingTypes.code')),
      name: requiredText(t, t('toolingTypes.name'), NAME_MAX),
    });

export type CreateToolingTypeSchema = z.infer<
  ReturnType<typeof createToolingTypeSchema>
>;
