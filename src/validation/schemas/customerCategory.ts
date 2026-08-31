import { z } from 'zod';
import { requiredText, Translate } from '../fields';

/**
 * B2 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   customer_categories.name varchar(255) NOT NULL, UNIQUE (companyId, name)
 *
 * `companyId` (NOT NULL here) is resolved by the controller from the caller's
 * token — a superAdmin's body-supplied company uuid is the only exception, and
 * it is never validated as a form field here (L-009).
 *
 * SIGN-OFF (2026-08-29), the two deliberate schema/UI gaps on this entity:
 *  - The column is varchar(255) but the form has always capped at 100. The
 *    column width is the CEILING, not the target: widening the cap would be a
 *    product regression, so 100 stays and the gap is documented, not closed.
 *  - `minLength: 2` has no schema backing (this batch's tables carry ZERO CHECK
 *    constraints) but is an existing UI convention. It is kept as-is here and
 *    deliberately NOT extended to any field that lacks it today.
 */

/** The UI's long-standing cap; the column itself is varchar(255). */
const NAME_MAX = 100;
/** UI-only convention carried over verbatim — no CHECK constraint backs it. */
const NAME_MIN = 2;

const name = (t: Translate) => {
  const label = t('customerCategories.name');
  return requiredText(t, label, NAME_MAX).min(
    NAME_MIN,
    t('validation.minLength', { field: label, min: NAME_MIN })
  );
};

export const createCustomerCategorySchema = (t: Translate) =>
  z.object({ name: name(t) });

/**
 * `name` is the entity's only field and the column is `notNullable`, so the
 * edit rules are the create rules; `.partial()` alone would let the user blank
 * it.
 */
export const editCustomerCategorySchema = (t: Translate) =>
  createCustomerCategorySchema(t).partial().extend({ name: name(t) });

export type CreateCustomerCategorySchema = z.infer<
  ReturnType<typeof createCustomerCategorySchema>
>;
