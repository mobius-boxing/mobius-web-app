import { z } from 'zod';
import {
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  requiredSelect,
  Translate,
} from '../fields';

/**
 * B7 schema. Bounds read from `information_schema.columns` on the live schema
 * (2026-08-30) (AMENDMENT A1):
 *   machines.code                   varchar(400)  NULL, UNIQUE ("companyId", code)
 *   machines.description            text          NULL
 *   machines.machineTypeId          integer       NOT NULL (FK)
 *   machines.setupTime              numeric(12,3) NOT NULL, default 0
 *   machines.sheetWidthMin/Max      numeric(12,3) NULL
 *   machines.sourceWarehouseId      integer       NULL (FK)
 *   machines.destinationWarehouseId integer       NULL (FK)
 *
 * `numeric(12,3)` → 999999999.999 with three decimals: the "dimension (mm)"
 * archetype, and the first entity in the sweep to use it.
 *
 * `machineTypeId` is the only NOT NULL foreign key, so it is the only required
 * select. The two warehouse FKs are nullable and stay optional.
 *
 * MachineModals also renders `sheetLengthMin/Max`, `box*Min/Max`,
 * `linearMeters` and `maxScoreLines` on other tabs of the same component; those
 * are real `numeric(12,3)` columns but are NOT registered fields in the modal
 * this batch touches, so they carry no client rule. The server DTO bounds all
 * of them regardless — the API is reachable without the form.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 400;
const DESCRIPTION_MAX = 10000;
/** numeric(12,3) */
const MEASURE_MAX = 999999999.999;
const MEASURE_DECIMALS = 3;

const measure = (t: Translate, label: string) =>
  nonNegativeNumber(t, label, {
    max: MEASURE_MAX,
    decimals: MEASURE_DECIMALS,
  });

export const createMachineSchema = (t: Translate) =>
  z.object({
    code: optionalText(t, t('machines.code'), CODE_MAX),
    machineTypeUuid: requiredSelect(t, t('machines.machineType')),
    description: optionalText(t, t('machines.description'), DESCRIPTION_MAX),
    setupTime: measure(t, t('machines.setupTime')),
    sheetWidthMin: measure(t, t('machines.sheetWidthMin')),
    sheetWidthMax: measure(t, t('machines.sheetWidthMax')),
    sourceWarehouseUuid: optionalSelect(),
    destinationWarehouseUuid: optionalSelect(),
  });

export const editMachineSchema = (t: Translate) =>
  createMachineSchema(t)
    .partial()
    .extend({
      machineTypeUuid: requiredSelect(t, t('machines.machineType')),
    });

export type CreateMachineSchema = z.infer<
  ReturnType<typeof createMachineSchema>
>;
