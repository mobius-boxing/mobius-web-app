import { z } from 'zod';
import { optionalText, requiredText, Translate } from '../fields';

/**
 * B2 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   color_types.name        varchar(255) NOT NULL, UNIQUE (companyId, name)
 *   color_types.description text         NULL
 *
 * `companyId` (NOT NULL here) is injected by the API from the caller's
 * token and is never a form field (L-009).
 *
 * `color_types` has NO `code` column at all — it is the mirror image of
 * `box_types`/`manufacturers`, and the reason this file imports `requiredText`
 * rather than the `code` primitive every other B2 entity uses. `legacyId` is a
 * real nullable column but has never been a form field.
 */

const NAME_MAX = 255;
/** `text` has no width, so this is the project-wide cap the B1 pilot set. */
const DESCRIPTION_MAX = 10000;

export const createColorTypeSchema = (t: Translate) =>
  z.object({
    name: requiredText(t, t('colorTypes.name'), NAME_MAX),
    description: optionalText(
      t,
      t('colorTypes.description'),
      DESCRIPTION_MAX
    ),
  });

/**
 * The Edit modal renders and `reset()`s both fields, so the create rules apply
 * unchanged; `name` is re-stated because `.partial()` alone would let the user
 * blank a notNullable column.
 */
export const editColorTypeSchema = (t: Translate) =>
  createColorTypeSchema(t)
    .partial()
    .extend({ name: requiredText(t, t('colorTypes.name'), NAME_MAX) });

export type CreateColorTypeSchema = z.infer<
  ReturnType<typeof createColorTypeSchema>
>;
