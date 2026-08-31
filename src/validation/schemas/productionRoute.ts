import { z } from 'zod';
import { boolean, requiredText, Translate } from '../fields';

/**
 * B7 schema, PATTERN B: `RouteFormModal` keeps its whole form in `useState`, so
 * this schema is called through `safeParse` in the submit handler rather than
 * through `useModalForm`. Same rules, different delivery.
 *
 * Bounds read from `information_schema.columns` on the live schema
 * (2026-08-30) (AMENDMENT A1):
 *   production_routes.name      varchar(400) NOT NULL
 *   production_routes.isGlobal  boolean      NOT NULL, default false
 *   production_routes.active    boolean      NOT NULL, default true
 *   production_routes.isDefault boolean      NOT NULL, default false
 *
 * `stages` is NOT validated here. A route's stages are rows in
 * `production_route_stages` with their own machines and supplies sub-tables
 * (both carrying real CHECK constraints on `direction` and `supplyType`), built
 * by a nested editor inside the same modal. Validating a nested, ordered,
 * three-level structure is a different problem from validating a form's fields,
 * and squeezing it in here would produce exactly the "looks finished, isn't"
 * outcome the B2 sign-off pulled `company` and `paperClass` out of B2 to avoid.
 * The stage editor keeps its existing behaviour; the server DTO remains the
 * guard on stage contents.
 */

const NAME_MAX = 400;

export const createProductionRouteSchema = (t: Translate) =>
  z.object({
    name: requiredText(t, t('productionRoutes.name'), NAME_MAX),
    isGlobal: boolean(),
    active: boolean(),
    isDefault: boolean(),
  });

export const editProductionRouteSchema = (t: Translate) =>
  createProductionRouteSchema(t)
    .partial()
    .extend({ name: requiredText(t, t('productionRoutes.name'), NAME_MAX) });

export type CreateProductionRouteSchema = z.infer<
  ReturnType<typeof createProductionRouteSchema>
>;
