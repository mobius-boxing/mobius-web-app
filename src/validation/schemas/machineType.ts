import { z } from 'zod';
import { boolean, optionalText, requiredText, Translate } from '../fields';

/**
 * B4 lookup schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   machine_types.name            varchar(400) NOT NULL, UNIQUE ("companyId", name)
 *   machine_types.attribute       varchar(400) NULL
 *   machine_types.requiresDie     boolean NOT NULL, default false
 *   machine_types.requiresPlate   boolean NOT NULL, default false
 *   machine_types.corrugated      boolean NOT NULL, default false
 *   machine_types.generatesSheets boolean NULL
 *   machine_types.location        smallint NULL
 *
 * This entity has NO `code` column — `name` carries the identity and the unique
 * index, so there is no `code(...)` rule here. Second such surprise in the
 * sweep after `color_types`.
 *
 * `location` is a real `smallint` column that NEITHER modal renders. It is
 * deliberately absent from this schema: a rule for a field the form never
 * collects would be dead weight, and adding the input is a product change no
 * batch is allowed to make (L-007's mirror image).
 *
 * `name` gains its first length rule here (the modal only had `required`).
 */

const NAME_MAX = 400;
const ATTRIBUTE_MAX = 400;

export const createMachineTypeSchema = (t: Translate) =>
  z.object({
    name: requiredText(t, t('machineTypes.name'), NAME_MAX),
    attribute: optionalText(t, t('machineTypes.attribute'), ATTRIBUTE_MAX),
    corrugated: boolean(),
    generatesSheets: boolean(),
    requiresDie: boolean(),
    requiresPlate: boolean(),
  });

export const editMachineTypeSchema = (t: Translate) =>
  createMachineTypeSchema(t)
    .partial()
    .extend({ name: requiredText(t, t('machineTypes.name'), NAME_MAX) });

export type CreateMachineTypeSchema = z.infer<
  ReturnType<typeof createMachineTypeSchema>
>;
