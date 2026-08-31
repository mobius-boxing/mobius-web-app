import { z } from 'zod';
import { code, requiredText, Translate } from '../fields';

/**
 * B2 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   manufacturers.code varchar(100) NOT NULL, UNIQUE (code) -- GLOBAL
 *   manufacturers.name varchar(255) NOT NULL
 *   (this table has NO `description` column — it is code+name)
 *
 * `companyId` (NOT NULL here) is injected by the API from the caller's
 * token and is never a form field (L-009).
 *
 * `code` is varchar(100) here — a THIRD width inside one batch (50 / 100 / 400),
 * which is exactly what a shared CODE_MAX constant would have gotten wrong.
 * Uniqueness is GLOBAL, so a 23505 from this table is cross-tenant.
 */

const CODE_MAX = 100;
const NAME_MAX = 255;

export const createManufacturerSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('manufacturers.code')),
    name: requiredText(t, t('manufacturers.name'), NAME_MAX),
  });

/**
 * Both columns are `notNullable` and the Edit modal `reset()`s both from the
 * row, so the create rules apply unchanged; re-stating them after `.partial()`
 * keeps a blanked field from reaching a NOT NULL violation.
 */
export const editManufacturerSchema = (t: Translate) =>
  createManufacturerSchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('manufacturers.code')),
      name: requiredText(t, t('manufacturers.name'), NAME_MAX),
    });

export type CreateManufacturerSchema = z.infer<
  ReturnType<typeof createManufacturerSchema>
>;
