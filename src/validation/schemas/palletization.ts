import { z } from 'zod';
import {
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  positiveInt,
  requiredText,
  Translate,
} from '../fields';

/**
 * B7 schema. Bounds read from `information_schema.columns` on the live schema
 * (2026-08-30) (AMENDMENT A1):
 *   palletizations.code               varchar(400)     NULL, UNIQUE ("companyId", code)
 *   palletizations.name               varchar(400)     NOT NULL
 *   palletizations.description        text             NULL
 *   palletizations.observations       text             NULL
 *   palletizations.stackingType       varchar(100)     NULL
 *   palletizations.boxesPerPackage    smallint NOT NULL default 0
 *   palletizations.packagesPerLevel   smallint NOT NULL default 0
 *   palletizations.levelsPerPallet    smallint NOT NULL default 0
 *   palletizations.additionalPackages smallint NOT NULL default 0
 *   palletizations.sheetsPerPallet    smallint NOT NULL default 0
 *   palletizations.maxPalletHeight    double precision NULL
 *   palletizations.surface            double precision NULL
 *   palletizations.palletTypeId       integer          NULL (FK)
 *
 * TWO DETAILS THE COLUMN TYPES ALONE WOULD GET WRONG, both from the table's
 * `palletizations_nonneg_chk` CHECK constraint:
 *
 *  1. The five counts are `smallint`, not `integer`: the ceiling is 32767, not
 *     2147483647. `positiveInt`'s default max would let 40000 through to a
 *     22003 range error.
 *
 *  2. The constraint reads
 *       boxesPerPackage >= 0 AND … AND
 *       (maxPalletHeight IS NULL OR maxPalletHeight > 0) AND
 *       (surface IS NULL OR surface > 0)
 *     — the counts are `>= 0` but the two measures are STRICTLY `> 0`. A zero
 *     height or surface is a 23514, so `min: 0` (this library's default) would
 *     be wrong for exactly those two fields. There is no "exclusive minimum"
 *     primitive, and inventing one for two fields is worse than expressing it
 *     directly: the smallest value a `double precision` can hold above zero is
 *     what `min` must be, so they use `Number.MIN_VALUE`.
 *
 * The two measures are `double precision` (L-010): no scale, so no `decimals`.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 400;
const NAME_MAX = 400;
const TEXT_MAX = 10000;
const STACKING_TYPE_MAX = 100;
/** smallint, not integer — see the header. */
const COUNT_MAX = 32767;

const count = (t: Translate, label: string) =>
  positiveInt(t, label, { min: 0, max: COUNT_MAX });

/**
 * `> 0`, not `>= 0`: `palletizations_nonneg_chk` rejects a zero here even
 * though it accepts one in every count on the same row.
 */
const strictlyPositiveMeasure = (t: Translate, label: string) =>
  nonNegativeNumber(t, label, { min: Number.MIN_VALUE });

export const createPalletizationSchema = (t: Translate) =>
  z.object({
    code: optionalText(t, t('palletizations.code'), CODE_MAX),
    name: requiredText(t, t('palletizations.name'), NAME_MAX),
    description: optionalText(t, t('palletizations.description'), TEXT_MAX),
    observations: optionalText(t, t('palletizations.observations'), TEXT_MAX),
    stackingType: optionalText(
      t,
      t('palletizations.stackingType'),
      STACKING_TYPE_MAX
    ),
    boxesPerPackage: count(t, t('palletizations.boxesPerPackage')),
    packagesPerLevel: count(t, t('palletizations.packagesPerLevel')),
    levelsPerPallet: count(t, t('palletizations.levelsPerPallet')),
    additionalPackages: count(t, t('palletizations.additionalPackages')),
    sheetsPerPallet: count(t, t('palletizations.sheetsPerPallet')),
    maxPalletHeight: strictlyPositiveMeasure(
      t,
      t('palletizations.maxPalletHeight')
    ),
    surface: strictlyPositiveMeasure(t, t('palletizations.surface')),
    palletTypeUuid: optionalSelect(),
  });

export const editPalletizationSchema = (t: Translate) =>
  createPalletizationSchema(t)
    .partial()
    .extend({ name: requiredText(t, t('palletizations.name'), NAME_MAX) });

export type CreatePalletizationSchema = z.infer<
  ReturnType<typeof createPalletizationSchema>
>;
