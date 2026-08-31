import { z } from 'zod';
import { code, optionalSelect, requiredText, Translate } from '../fields';

/**
 * B7 schema, PATTERN B: `ModelFormModal` keeps its form in `useState`, so this
 * is called through `safeParse` in the submit handler.
 *
 * BOUNDS SOURCE, and the one place this batch departs from AMENDMENT A1: the
 * `models` table DOES NOT EXIST in the database reachable from this machine.
 * The local schema stops at migration `20260813000002`, and `models` arrives in
 * `20260820000001_create_models_table.ts`. So these bounds are read from that
 * MIGRATION, not from `information_schema.columns` like every other file in the
 * program:
 *   models.code        varchar(100) NULL at the column — "Nullable at the
 *                      column for a future ETL (D-2); the API requires it"
 *   models.description text NOT NULL
 *   models.flapTypeId   integer NULL (FK, ON DELETE SET NULL)
 *   models.complementId integer NULL (FK, ON DELETE SET NULL)
 *   models.textsOnImage jsonb NOT NULL default '[]'
 *   models.imageFileUuid uuid NULL
 *
 * Re-check these against the live schema before trusting them, and note the
 * migration's own comment resolves the `code` question for us: the column is
 * nullable only to leave room for an ETL, and the API requires it — so `code`
 * is REQUIRED here, on the migration author's explicit instruction rather than
 * on the B2 "keep the stricter UI rule" precedent.
 *
 * The ten formula columns (`sheetLengthFormula`, `lowerFlapFormula`, …) are
 * NCalc expressions evaluated for Procusto parity (L-010). They are plain
 * `text` and are deliberately NOT length-checked or pattern-checked here:
 * a formula's validity is whether NCalc can evaluate it, which this library
 * cannot answer, and a length cap invented for them could reject a legitimate
 * expression. They stay unvalidated rather than badly validated.
 *
 * `textsOnImage` is a jsonb array built by the image annotator, not a field.
 */

const CODE_MAX = 100;
const DESCRIPTION_MAX = 10000;

export const createModelSchema = (t: Translate) =>
  z.object({
    // Required per the migration's own comment, not per a UI convention.
    code: code(t, CODE_MAX, t('models.fields.code')),
    description: requiredText(
      t,
      t('models.fields.description'),
      DESCRIPTION_MAX
    ),
    flapTypeUuid: optionalSelect(),
    complementUuid: optionalSelect(),
  });

export const editModelSchema = (t: Translate) =>
  createModelSchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('models.fields.code')),
      description: requiredText(
        t,
        t('models.fields.description'),
        DESCRIPTION_MAX
      ),
    });

export type CreateModelSchema = z.infer<ReturnType<typeof createModelSchema>>;
