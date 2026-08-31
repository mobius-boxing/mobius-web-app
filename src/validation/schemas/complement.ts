import { z } from 'zod';
import { code, optionalText, Translate } from '../fields';

/**
 * B2 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   complements.code        varchar(50) NOT NULL, UNIQUE (companyId, code)
 *   complements.description text         NULL
 *
 * `companyId` (NULLABLE here, tolerating legacy global rows) is injected by the API from the caller's
 * token and is never a form field (L-009).
 *
 * Before: `code` carried `required` and nothing else — no length bound against
 * a varchar(50) column, no format check — and `description` carried no rule
 * at all. Both are TIGHTENed here; neither makes the form reject anything the
 * live data contains (all overlength/regex data checks returned 0 rows).
 */

const CODE_MAX = 50;
/** `text` has no width, so this is the project-wide cap the B1 pilot set. */
const DESCRIPTION_MAX = 10000;

export const createComplementSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('complements.code')),
    description: optionalText(
      t,
      t('complements.description'),
      DESCRIPTION_MAX
    ),
  });

/**
 * The Edit modal renders and `reset()`s both fields, so the create rules apply
 * unchanged; `code` is re-stated because `.partial()` alone would let the user
 * blank it.
 */
export const editComplementSchema = (t: Translate) =>
  createComplementSchema(t)
    .partial()
    .extend({ code: code(t, CODE_MAX, t('complements.code')) });

export type CreateComplementSchema = z.infer<
  ReturnType<typeof createComplementSchema>
>;
