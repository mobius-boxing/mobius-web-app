import { z } from 'zod';
import { code, optionalText, Translate } from '../fields';

/**
 * B2 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   paper_types.code        varchar(50) NOT NULL, UNIQUE (code) -- GLOBAL
 *   paper_types.description text         NULL
 *
 * `companyId` (NOT NULL here) is injected by the API from the caller's
 * token and is never a form field (L-009).
 *
 * One of the six modals that hardcoded ENGLISH validation copy ('Code is
 * required'). The 50-char bound already matched the column, so what this adds is
 * the Spanish `validation.*` messages, the format check, and a rule on
 * `description`.
 *
 * Uniqueness is GLOBAL (`code` alone), so a 23505 here is cross-tenant.
 */

const CODE_MAX = 50;
/** `text` has no width, so this is the project-wide cap the B1 pilot set. */
const DESCRIPTION_MAX = 10000;

export const createPaperTypeSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('paperTypes.code')),
    description: optionalText(
      t,
      t('paperTypes.description'),
      DESCRIPTION_MAX
    ),
  });

/**
 * The Edit modal renders and `reset()`s both fields, so the create rules apply
 * unchanged; `code` is re-stated because `.partial()` alone would let the user
 * blank it.
 */
export const editPaperTypeSchema = (t: Translate) =>
  createPaperTypeSchema(t)
    .partial()
    .extend({ code: code(t, CODE_MAX, t('paperTypes.code')) });

export type CreatePaperTypeSchema = z.infer<
  ReturnType<typeof createPaperTypeSchema>
>;
