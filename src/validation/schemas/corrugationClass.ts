import { z } from 'zod';
import { code, optionalText, Translate } from '../fields';

/**
 * B2 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   corrugation_classes.code        varchar(50) NOT NULL, UNIQUE (code) -- GLOBAL
 *   corrugation_classes.description text         NULL
 *
 * `companyId` (NOT NULL here) is injected by the API from the caller's
 * token and is never a form field (L-009).
 *
 * The 50-char bound already matched the column; what this adds is the format
 * check, a rule on `description`, and the parameterised Spanish messages.
 *
 * Uniqueness is GLOBAL (`corrugation_classes_code_unique` covers `code` alone),
 * so a 23505 from this table is cross-tenant rather than per-tenant.
 */

const CODE_MAX = 50;
/** `text` has no width, so this is the project-wide cap the B1 pilot set. */
const DESCRIPTION_MAX = 10000;

export const createCorrugationClassSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('corrugationClasses.code')),
    description: optionalText(
      t,
      t('corrugationClasses.description'),
      DESCRIPTION_MAX
    ),
  });

/**
 * The Edit modal renders and `reset()`s both fields, so the create rules apply
 * unchanged; `code` is re-stated because `.partial()` alone would let the user
 * blank it.
 */
export const editCorrugationClassSchema = (t: Translate) =>
  createCorrugationClassSchema(t)
    .partial()
    .extend({ code: code(t, CODE_MAX, t('corrugationClasses.code')) });

export type CreateCorrugationClassSchema = z.infer<
  ReturnType<typeof createCorrugationClassSchema>
>;
