import { z } from 'zod';
import { code, optionalText, Translate } from '../fields';

/**
 * B2 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   fsc_types.code        varchar(400) NULL, UNIQUE (companyId, code)
 *   fsc_types.description text          NULL
 *
 * `companyId` (NOT NULL here) is injected by the API from the caller's
 * token and is never a form field (L-009).
 *
 * SIGN-OFF (2026-08-29): as with `delivery_zones`, the column is NULLABLE but the
 * client rule stays `required` — 0 of 46 rows lack a code and the form has never
 * accepted a blank one. The follow-up NOT NULL migration is outside B2.
 */

const CODE_MAX = 400;
/** `text` has no width, so this is the project-wide cap the B1 pilot set. */
const DESCRIPTION_MAX = 10000;

export const createFscTypeSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('fscTypes.code')),
    description: optionalText(
      t,
      t('fscTypes.description'),
      DESCRIPTION_MAX
    ),
  });

/**
 * The Edit modal renders and `reset()`s both fields, so the create rules apply
 * unchanged; `code` is re-stated because `.partial()` alone would let the user
 * blank it.
 */
export const editFscTypeSchema = (t: Translate) =>
  createFscTypeSchema(t)
    .partial()
    .extend({ code: code(t, CODE_MAX, t('fscTypes.code')) });

export type CreateFscTypeSchema = z.infer<
  ReturnType<typeof createFscTypeSchema>
>;
