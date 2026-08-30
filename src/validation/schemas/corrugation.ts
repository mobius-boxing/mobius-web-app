import { z } from 'zod';
import {
  code,
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  Translate,
} from '../fields';

/**
 * B4 lookup schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   corrugations.code                varchar(50)   NOT NULL, UNIQUE (code) — GLOBAL
 *   corrugations.description         text          NULL
 *   corrugations.theoreticalGrammage numeric(10,2) NULL
 *   corrugations.suggestedWidth      numeric(10,2) NULL
 *   corrugations.caliper             numeric(10,4) NULL
 *   corrugations.corrugationClassId  integer       NULL (FK, nullable → optional)
 *
 * The three numerics are the first in this sweep with DIFFERENT scales on the
 * same form: `numeric(10,2)` allows 99999999.99, `numeric(10,4)` only
 * 999999.9999 — the same precision spends its digits differently. They get
 * separate constants for that reason; one shared "measure" helper would be
 * wrong for `caliper`.
 *
 * The modal's `data.x ? Number(x)` block is deleted with this schema.
 *
 * NOT in this schema, deliberately: `layers`. The corrugation layer grid is
 * local `useState` managed by its own child component and posted alongside the
 * form values, not registered with react-hook-form — validating it needs the
 * bespoke pattern-B treatment, which is B7's job, not a lookup sweep's.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 50;
const DESCRIPTION_MAX = 10000;
/** numeric(10,2) */
const GRAMMAGE_MAX = 99999999.99;
/** numeric(10,4) — same precision, four decimals, so a far smaller ceiling. */
const CALIPER_MAX = 999999.9999;

export const createCorrugationSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('corrugations.code')),
    description: optionalText(
      t,
      t('corrugations.description'),
      DESCRIPTION_MAX
    ),
    corrugationClassUuid: optionalSelect(),
    theoreticalGrammage: nonNegativeNumber(
      t,
      t('corrugations.theoreticalGrammage'),
      { max: GRAMMAGE_MAX, decimals: 2 }
    ),
    suggestedWidth: nonNegativeNumber(t, t('corrugations.suggestedWidth'), {
      max: GRAMMAGE_MAX,
      decimals: 2,
    }),
    caliper: nonNegativeNumber(t, t('corrugations.caliper'), {
      max: CALIPER_MAX,
      decimals: 4,
    }),
  });

export const editCorrugationSchema = (t: Translate) =>
  createCorrugationSchema(t)
    .partial()
    .extend({ code: code(t, CODE_MAX, t('corrugations.code')) });

export type CreateCorrugationSchema = z.infer<
  ReturnType<typeof createCorrugationSchema>
>;
