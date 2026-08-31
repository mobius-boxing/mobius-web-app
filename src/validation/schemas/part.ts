import { z } from 'zod';
import {
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  requiredSelect,
  Translate,
} from '../fields';

/**
 * B8 schema, PATTERN B: `PartFormModal` keeps its whole form in `useState`, so
 * this runs through `firstIssue` in the submit handler.
 *
 * Bounds read from `information_schema.columns` on the live schema
 * (2026-08-30) (AMENDMENT A1):
 *   parts.code                 varchar(400) NULL, UNIQUE ("companyId", code, revision)
 *   parts.clientCode           text         NULL
 *   parts.description          text         NULL
 *   parts.corrugationId        integer      NOT NULL (FK)
 *   parts.box…/sheet…/flap… dimensions  double precision NULL (17 of them)
 *   parts.colorCount           integer      NULL
 *   parts.labelsPerPallet      smallint     NULL
 *   parts.symmetricScoreLines, parts.print… flags  boolean NOT NULL, default false
 *
 * EVERY DIMENSION IS `double precision`, not `numeric` (L-010): Procusto parity
 * keeps float columns float, so there is no scale to enforce and no `decimals`
 * rule. Bound is `>= 0`.
 *
 * `corrugationUuid` is the one required select: `parts.corrugationId` is the
 * only NOT NULL foreign key of the set the modal edits.
 *
 * `modelUuid`/`flapTypeUuid`/`glueTypeUuid` were added to this form by the
 * product-model change that landed alongside this program (see the product
 * schema's header). They are nullable FKs, hence optional selects.
 *
 * The score-line grids (`corrugationScoreLines`, `printScoreLines`) are
 * pipe-separated formula strings built by a sub-editor, like a model's formula
 * fields — validating them means evaluating NCalc, which this library cannot
 * do, so they stay out rather than being badly checked.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 400;
const TEXT_MAX = 10000;

/** `double precision`: no scale, no `decimals` (L-010). */
const measure = (t: Translate, label: string) => nonNegativeNumber(t, label);

export const partSchema = (t: Translate) =>
  z.object({
    code: optionalText(t, t('parts.code'), CODE_MAX),
    clientCode: optionalText(t, t('parts.clientCode'), TEXT_MAX),
    description: optionalText(t, t('parts.description'), TEXT_MAX),
    corrugationUuid: requiredSelect(t, t('parts.corrugation')),
    productionRouteUuid: optionalSelect(),
    palletizationUuid: optionalSelect(),
    modelUuid: optionalSelect(),
    flapTypeUuid: optionalSelect(),
    glueTypeUuid: optionalSelect(),
    strappingTypeUuid: optionalSelect(),
    traceTypeUuid: optionalSelect(),
    complementUuid: optionalSelect(),
    boxLength: measure(t, t('parts.boxLength')),
    boxWidth: measure(t, t('parts.boxWidth')),
    boxHeight: measure(t, t('parts.boxHeight')),
    sheetLength: measure(t, t('parts.sheetLength')),
    sheetWidth: measure(t, t('parts.sheetWidth')),
  });

export type PartSchema = z.infer<ReturnType<typeof partSchema>>;
