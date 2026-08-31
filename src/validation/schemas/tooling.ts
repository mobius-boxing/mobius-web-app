import { z } from 'zod';
import {
  optionalSelect,
  optionalText,
  positiveInt,
  requiredSelect,
  requiredText,
  Translate,
} from '../fields';

/**
 * B5 supply schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   toolings.name           varchar(255) NOT NULL
 *   toolings.code           varchar(400) NULL
 *   toolings.description    text         NULL
 *   toolings.toolingTypeId  integer      NOT NULL (FK)
 *   toolings.manufacturerId integer      NULL     (FK)
 *   toolings.supplierId     integer      NULL     (FK)
 *   toolings.minimumStock   integer      NULL, default 0
 *
 * `toolingTypeId` is the only NOT NULL foreign key, and the modal already
 * marked it required — column and form agree, nothing to reconcile.
 *
 * `code` is NULLABLE here and the modal never required it, so unlike
 * `palletType`/`color` this one genuinely stays optional. It also uses
 * `optionalText`, not the `code()` identifier pattern: this column has no
 * unique index and no character rule has ever applied to it.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const NAME_MAX = 255;
const CODE_MAX = 400;
const DESCRIPTION_MAX = 10000;

export const createToolingSchema = (t: Translate) =>
  z.object({
    name: requiredText(t, t('toolings.name'), NAME_MAX),
    code: optionalText(t, t('toolings.code'), CODE_MAX),
    description: optionalText(t, t('toolings.description'), DESCRIPTION_MAX),
    toolingTypeUuid: requiredSelect(t, t('toolings.toolingType')),
    manufacturerUuid: optionalSelect(),
    supplierUuid: optionalSelect(),
    minimumStock: positiveInt(t, t('toolings.minimumStock')),
  });

export const editToolingSchema = (t: Translate) =>
  createToolingSchema(t)
    .partial()
    .extend({
      name: requiredText(t, t('toolings.name'), NAME_MAX),
      toolingTypeUuid: requiredSelect(t, t('toolings.toolingType')),
    });

export type CreateToolingSchema = z.infer<
  ReturnType<typeof createToolingSchema>
>;
