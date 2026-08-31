import { z } from 'zod';
import {
  boolean,
  optionalSelect,
  optionalText,
  requiredText,
  Translate,
} from '../fields';

/**
 * B7 schema. Bounds read from `information_schema.columns` on the live schema
 * (2026-08-30) (AMENDMENT A1):
 *   customers.name                       varchar(255) NOT NULL
 *   customers.legalName/tradeName        varchar(255) NULL
 *   customers.legal_code/supplier_code   varchar(255) NULL   ← snake_case columns
 *   customers.code                       varchar(400) NULL, UNIQUE ("companyId", code)
 *   customers.address/notes              text         NULL
 *   customers.active                     boolean NULL,     default true
 *   customers.dispatchable               boolean NOT NULL, default true
 *   customers.excludeLogoOnLabels        boolean NOT NULL, default false
 *   customers.requiresQualityCertificate boolean NOT NULL, default false
 *   customers.categoryId/salesPersonId   integer NULL (FK)
 *   customers.contacts                   jsonb NULL, default '[]'
 *
 * FIELD NAMES DIVERGE FROM COLUMN NAMES on two fields: the form sends
 * `legalCode`/`supplierCode`, the columns are `legal_code`/`supplier_code`. The
 * DAO maps them; the rules follow the FORM's names because that is what the
 * user types into and what an error must be pinned to.
 *
 * `name` keeps its `minLength: 2`, chained onto `requiredText` rather than
 * added to the primitive: the B2 sign-off ruled that the four fields carrying
 * that UI-only convention keep it verbatim and that it is NOT extended to
 * fields that lack it, so it stays a per-field decision and its original
 * message key is reused.
 *
 * `contacts` is NOT here: the modal keeps the contact list in `useState` and
 * composes the jsonb array on submit, so it is pattern-B work like the
 * corrugation layer grid, not a registered field.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const NAME_MAX = 255;
const NAME_MIN = 2;
const CODE_MAX = 400;
const TEXT_MAX = 10000;

export const createCustomerSchema = (t: Translate) =>
  z.object({
    name: requiredText(t, t('common:customerModal.customerName'), NAME_MAX).min(
      NAME_MIN,
      t('common:customerModal.validation.nameMinLength')
    ),
    legalName: optionalText(
      t,
      t('common:customerModal.legalName'),
      NAME_MAX
    ),
    tradeName: optionalText(
      t,
      t('common:customerModal.tradeName'),
      NAME_MAX
    ),
    legalCode: optionalText(
      t,
      t('common:customerModal.legalCode'),
      NAME_MAX
    ),
    supplierCode: optionalText(
      t,
      t('common:customerModal.supplierCode'),
      NAME_MAX
    ),
    code: optionalText(t, t('common:customerModal.code'), CODE_MAX),
    address: optionalText(t, t('common:customerModal.address'), TEXT_MAX),
    notes: optionalText(t, t('common:customerModal.notes'), TEXT_MAX),
    categoryId: optionalSelect(),
    salesPersonId: optionalSelect(),
    active: boolean(),
    dispatchable: boolean(),
    excludeLogoOnLabels: boolean(),
    requiresQualityCertificate: boolean(),
  });

export const editCustomerSchema = (t: Translate) =>
  createCustomerSchema(t)
    .partial()
    .extend({
      name: requiredText(
        t,
        t('common:customerModal.customerName'),
        NAME_MAX
      ).min(NAME_MIN, t('common:customerModal.validation.nameMinLength')),
    });

export type CreateCustomerSchema = z.infer<
  ReturnType<typeof createCustomerSchema>
>;
