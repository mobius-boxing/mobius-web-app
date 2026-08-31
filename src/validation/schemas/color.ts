import { z } from 'zod';
import {
  code,
  optionalSelect,
  optionalText,
  positiveInt,
  Translate,
} from '../fields';

/**
 * B4 lookup schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   colors.code         varchar(400) NULL, UNIQUE ("companyId", code)
 *   colors.name         varchar(255) NULL
 *   colors.description  text         NULL
 *   colors.observations text         NULL
 *   colors.tonality     integer      NULL
 *   colors.colorTypeId  integer      NULL  (FK, nullable → optional select)
 *
 * REQUIRED-NESS CONFLICT resolved the B2 way: `code` is nullable in the column,
 * `required` in the modal; the client rule is KEPT.
 *
 * `tonality` is a plain `integer` with no CHECK constraint, so the only true
 * bounds are 0..2147483647 (`positiveInt`'s default ceiling). It replaces the
 * hand-rolled `Number(data.tonality)` block in the modal, which turned a
 * cleared field into `NaN` — the exact bug this library exists for.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 400;
const NAME_MAX = 255;
const TEXT_MAX = 10000;

export const createColorSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('colors.code')),
    name: optionalText(t, t('colors.name'), NAME_MAX),
    description: optionalText(t, t('colors.description'), TEXT_MAX),
    observations: optionalText(t, t('colors.observations'), TEXT_MAX),
    tonality: positiveInt(t, t('colors.tonality')),
    colorTypeUuid: optionalSelect(),
  });

export const editColorSchema = (t: Translate) =>
  createColorSchema(t)
    .partial()
    .extend({ code: code(t, CODE_MAX, t('colors.code')) });

export type CreateColorSchema = z.infer<ReturnType<typeof createColorSchema>>;
