import { z } from 'zod';
import {
  boolean,
  code,
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  positiveInt,
  requiredSelect,
  Translate,
} from '../fields';

/**
 * The flat product schema (remove-composite-products): `parts` folded onto
 * `products` (model.md D-1), so this single schema now covers what used to be
 * split across `product.ts` (identity) and `part.ts` (recipe).
 *
 * Bounds: `products.code`/`clientCode` stay `varchar(100)`; every folded
 * dimension is `double precision` (L-010) — no scale, bound `>= 0`, hence no
 * `decimals` rule, same as the part schema it replaces.
 *
 * `corrugationUuid` is required CLIENT-SIDE only (D-14: the API accepts a
 * product with none). The web form always shows a corrugation card, so a
 * product created here always has one.
 *
 * The score-line grids (`corrugationScoreLines`, `printScoreLines`) stay
 * unvalidated for the same reason `part.ts` left them out: checking them means
 * evaluating NCalc, which this library cannot do.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 100;
const TEXT_MAX = 10000;

/** `double precision`: no scale, no `decimals` (L-010). */
const measure = (t: Translate, label: string) => nonNegativeNumber(t, label);

export const productSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('products.code')),
    clientCode: optionalText(t, t('products.clientCode'), CODE_MAX),
    description: optionalText(t, t('products.description'), TEXT_MAX),
    customerId: requiredSelect(t, t('products.customer')),
    revision: positiveInt(t, t('products.revision')),
    vip: boolean(),

    corrugationUuid: requiredSelect(t, t('products.fields.corrugation')),
    modelUuid: optionalSelect(),
    productionRouteUuid: optionalSelect(),
    palletizationUuid: optionalSelect(),
    flapTypeUuid: optionalSelect(),
    glueTypeUuid: optionalSelect(),
    strappingTypeUuid: optionalSelect(),
    traceTypeUuid: optionalSelect(),
    complementUuid: optionalSelect(),

    externalLength: measure(t, t('products.fields.externalLength')),
    externalWidth: measure(t, t('products.fields.externalWidth')),
    externalHeight: measure(t, t('products.fields.externalHeight')),
    boxLength: measure(t, t('products.fields.boxLength')),
    boxWidth: measure(t, t('products.fields.boxWidth')),
    boxHeight: measure(t, t('products.fields.boxHeight')),
    sheetLength: measure(t, t('products.fields.sheetLength')),
    sheetWidth: measure(t, t('products.fields.sheetWidth')),
    additionalSheetLength: measure(t, t('products.fields.additionalSheetLength')),
    preferredWidth: measure(t, t('products.fields.preferredWidth')),
    flap: measure(t, t('products.fields.flap')),
    lowerFlap: measure(t, t('products.fields.lowerFlap')),
    upperFlap: measure(t, t('products.fields.upperFlap')),
    flapOverlap: measure(t, t('products.fields.flapOverlap')),
    corrugationScoreLines: optionalText(t, t('products.fields.corrugationScoreLines'), TEXT_MAX),
    printScoreLines: optionalText(t, t('products.fields.printScoreLines'), TEXT_MAX),
    symmetricScoreLines: boolean(),
    colorCount: positiveInt(t, t('products.fields.colorCount')),
    printSides: measure(t, t('products.fields.printSides')),
    inks: optionalText(t, t('products.fields.inks'), TEXT_MAX),
    grammage: measure(t, t('products.fields.grammage')),
    boxSurface: measure(t, t('products.fields.boxSurface')),

    labelsPerPallet: positiveInt(t, t('products.fields.labelsPerPallet')),
    labelText: optionalText(t, t('products.fields.labelText'), TEXT_MAX),
    printCode: boolean(),
    printDate: boolean(),
    printRecyclable: boolean(),
    printWarranty: boolean(),
    printLogo: boolean(),
    printNationalIndustry: boolean(),
    printExport: boolean(),
    compressionTest: measure(t, t('products.fields.compressionTest')),
    burstTest: measure(t, t('products.fields.burstTest')),
    cobbTest: measure(t, t('products.fields.cobbTest')),
    ect: measure(t, t('products.fields.ect')),
    lengthUpperTolerance: measure(t, t('products.fields.lengthUpperTolerance')),
    lengthLowerTolerance: measure(t, t('products.fields.lengthLowerTolerance')),
    widthUpperTolerance: measure(t, t('products.fields.widthUpperTolerance')),
    widthLowerTolerance: measure(t, t('products.fields.widthLowerTolerance')),
    overrunPercentage: measure(t, t('products.fields.overrunPercentage')),
    underrunPercentage: measure(t, t('products.fields.underrunPercentage')),
    corrugationOverproduction: measure(t, t('products.fields.corrugationOverproduction')),
    allowsRotation: boolean(),
    allowsPartialRotation: boolean(),
    mandatoryRotation: boolean(),
    averageWeight: measure(t, t('products.fields.averageWeight')),
    allowsGluing: boolean(),
    claspClosure: optionalText(t, t('products.fields.claspClosure'), TEXT_MAX),
    associatedQuantity: measure(t, t('products.fields.associatedQuantity')),
    foodSafetyNumber: optionalText(t, t('products.fields.foodSafetyNumber'), TEXT_MAX),
    blueprintRef: optionalText(t, t('products.fields.blueprintRef'), TEXT_MAX),
    notes: optionalText(t, t('products.fields.notes'), TEXT_MAX),
    quotingNotes: optionalText(t, t('products.fields.quotingNotes'), TEXT_MAX),
  });

export type ProductSchema = z.infer<ReturnType<typeof productSchema>>;
