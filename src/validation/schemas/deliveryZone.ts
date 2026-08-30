import { z } from 'zod';
import { code, optionalText, Translate } from '../fields';

/**
 * B2 lookup schema. Every bound below was read from `information_schema.columns`
 * on the live `traffic_production` schema (2026-08-29) — never from the modal's
 * old inline rules, and never from the demoted archetype table (AMENDMENT A1):
 *   delivery_zones.code        varchar(400) NULL, UNIQUE (companyId, code)
 *   delivery_zones.description text          NULL
 *
 * `companyId` (NOT NULL here) is injected by the API from the caller's
 * token and is never a form field (L-009).
 *
 * SIGN-OFF (2026-08-29): the column is NULLABLE, yet the client rule stays
 * `required`. The UI has never accepted a blank code and 0 of 46 rows lack one,
 * so this reads as sloppy schema rather than intended nullability — dropping the
 * requirement would be a product regression, not a correction. A follow-up card
 * adds NOT NULL to `delivery_zones.code`; until then the two knowingly disagree.
 */

const CODE_MAX = 400;
/** `text` has no width, so this is the project-wide cap the B1 pilot set. */
const DESCRIPTION_MAX = 10000;

export const createDeliveryZoneSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('deliveryZones.code')),
    description: optionalText(
      t,
      t('deliveryZones.description'),
      DESCRIPTION_MAX
    ),
  });

/**
 * The Edit modal renders and `reset()`s both fields, so the create rules apply
 * unchanged; `code` is re-stated because `.partial()` alone would let the user
 * blank it.
 */
export const editDeliveryZoneSchema = (t: Translate) =>
  createDeliveryZoneSchema(t)
    .partial()
    .extend({ code: code(t, CODE_MAX, t('deliveryZones.code')) });

export type CreateDeliveryZoneSchema = z.infer<
  ReturnType<typeof createDeliveryZoneSchema>
>;
