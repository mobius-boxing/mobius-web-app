import { z } from 'zod';
import {
  code,
  nonNegativeNumber,
  optionalText,
  Translate,
} from '../fields';

/**
 * Bounds read from the migrations, NOT from the modal's old inline rules:
 *   `20251101162721_create_flute_types_table.ts`
 *     code        varchar(50) NOT NULL UNIQUE  -> required, max 50
 *     description text NULL                    -> optional, max 10000 (archetype)
 *     fluteFactor / length / width / height
 *                 numeric(8,2) NULL            -> optional, 0..999999.99, 2 dp
 *   `20260120143704_add_company_id_to_master_tables.ts`
 *     companyId   integer NOT NULL             -> injected by the API from the
 *                                                 caller's token, never a form
 *                                                 field (L-009)
 *
 * The four numeric fields carried ZERO rules before, on `type="number"` inputs
 * whose empty value became `NaN` on the way to Postgres.
 */
const CODE_MAX = 50;
const DESCRIPTION_MAX = 10000;
const DECIMAL_MAX = 999999.99;
const DECIMALS = 2;

const measure = (t: Translate, label: string) =>
  nonNegativeNumber(t, label, { max: DECIMAL_MAX, decimals: DECIMALS });

export const createFluteTypeSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('fluteTypes.code')),
    description: optionalText(t, t('fluteTypes.description'), DESCRIPTION_MAX),
    fluteFactor: measure(t, t('fluteTypes.fluteFactor')),
    length: measure(t, t('fluteTypes.length')),
    width: measure(t, t('fluteTypes.width')),
    height: measure(t, t('fluteTypes.height')),
  });

/**
 * Update sends only the fields it carries, so everything is optional — except
 * `code`, which the form always renders and the column declares `notNullable`.
 * Blanking it must fail here rather than reach a NOT NULL violation.
 */
export const editFluteTypeSchema = (t: Translate) =>
  createFluteTypeSchema(t)
    .partial()
    .extend({ code: code(t, CODE_MAX, t('fluteTypes.code')) });

export type CreateFluteTypeSchema = z.infer<
  ReturnType<typeof createFluteTypeSchema>
>;
