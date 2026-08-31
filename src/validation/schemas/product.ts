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
 * B8 schema. Bounds read from `information_schema.columns` on the live schema
 * (2026-08-30) (AMENDMENT A1):
 *   products.code        varchar(100) NOT NULL, UNIQUE ("companyId", code)
 *   products.clientCode  varchar(100) NULL
 *   products.description text         NULL
 *   products.customerId  integer      NOT NULL (FK)
 *   products.revision    integer      NOT NULL, default 0
 *   products.vip         boolean      NOT NULL, default false
 *
 * `customerId` is the only NOT NULL foreign key on the form and is required;
 * `revision` is NOT NULL with a default, so a blank omits the key and lets the
 * default apply rather than writing 0 explicitly.
 *
 * B8 IS THE BATCH THAT WAS WARNED ABOUT: the brief flags these files as owned
 * by other work in flight, to be re-read from disk at batch start. That work
 * landed while this program was running — `productTypeId`/`boxTypeId` were
 * REMOVED from the create form and `model`/`flapType`/`glueType` added to the
 * inline part. This schema is written against the form as it exists NOW, not as
 * the brief described it. `products.productTypeId`/`boxTypeId` are still real
 * nullable columns, but no form field sets them any more, so they carry no
 * client rule.
 *
 * THE INLINE PART: `CreateProductModal` registers `initialPart.*` fields for
 * the simple-product case, which react-hook-form nests. `initialPartSchema`
 * below mirrors the `parts` columns those inputs write, and is attached under
 * the same key so an error lands on `initialPart.sheetLength` — the path the
 * input is registered at.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 100;
const CLIENT_CODE_MAX = 100;
const DESCRIPTION_MAX = 10000;

/**
 * `parts` dimensions are `double precision` (L-010): no scale, so no
 * `decimals` — same reasoning as `palletType`.
 */
const partMeasure = (t: Translate, label: string) =>
  nonNegativeNumber(t, label, {});

const initialPartSchema = (t: Translate) =>
  z.object({
    corrugationUuid: requiredSelect(t, t('products.initialPart.corrugation')),
    modelUuid: optionalSelect(),
    flapTypeUuid: optionalSelect(),
    glueTypeUuid: optionalSelect(),
    productionRouteUuid: optionalSelect(),
    sheetLength: partMeasure(t, t('products.initialPart.sheetLength')),
    sheetWidth: partMeasure(t, t('products.initialPart.sheetWidth')),
  });

export const createProductSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('products.code')),
    clientCode: optionalText(t, t('products.clientCode'), CLIENT_CODE_MAX),
    description: optionalText(t, t('products.description'), DESCRIPTION_MAX),
    customerId: requiredSelect(t, t('products.customer')),
    revision: positiveInt(t, t('products.revision')),
    vip: boolean(),
    // Present only in "simple" mode; `.optional()` keeps the composite mode,
    // which submits no part at all, valid.
    initialPart: initialPartSchema(t).optional(),
  });

export const editProductSchema = (t: Translate) =>
  createProductSchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('products.code')),
      customerId: requiredSelect(t, t('products.customer')),
    });

export type CreateProductSchema = z.infer<
  ReturnType<typeof createProductSchema>
>;
