---
name: review-recurring-patterns
description: Defect patterns that keep recurring in Mobius reviews (uuid filters that 500, null-vs-absent payloads, audit snapshot leaks, cross-feature column assumptions) — check these every review
metadata:
  type: project
---

Recurring Mobius defect families worth checking on every review, in rough order
of how often they have actually bitten.

**Why:** each of these has appeared in more than one feature and none of them is
caught by the type checker or by the feature's own unit tests.

**How to apply:** walk this list during the quality audit before writing findings.

1. **`field: null` from the frontend defeats "absent ⇒ server default" rules.**
   Input DTOs distinguish "key sent" (`sent()` / `providedKeys`) from
   "value truthy". Forms that build one flat payload object usually send every
   optional key as `null`, which the controller reads as an explicit clear.
   Always diff the form's `buildPayload` against the controller's
   `sent(key) ? … : default` branches. (Hit in sales-order-create: the vendedor
   default from `customers.salesPersonId` never applied for UI-created pedidos.)

2. **uuid-valued list filters are not shape-validated → 500.** The
   `getAllWithFilters` pattern does `knex(table).where("uuid", <raw query value>)`
   on a `uuid` column; a malformed value raises PG 22P02 and surfaces as a 500,
   not a 400. `sales-order.dao.ts`'s `assertUuidParam` is the good version;
   `product.dao.ts` / `delivery-location.dao.ts` / `part.dao.ts` are not.

3. **Numeric `*Id` entries in `FilterConfigs` are client-reachable.**
   The uuid→id resolution pattern writes `parsedQuery.filters.customerId`, which
   only works because the config exposes `customerId` — so `?customerId=5` also
   works from a client (internal-id enumeration) and `?customerId=abc` →
   `parseInt` → NaN → 500. Applying the resolved id through an `applyExtra`
   closure instead (product.dao.ts) keeps it unreachable.

4. **Audit snapshots bypass per-caller field projections.** `AuditService`
   stores the whole entity for Alta/Modificacion and `GET /api/audit-logs`
   selects `*` behind `requireAdmin()` only. Any field hidden per-permission in
   a controller (e.g. `salesSector`) is still readable there.

5. **Cross-feature column assumptions.** Features land on one shared branch and
   later ones read columns earlier ones never populate (production-order
   generation requires `sales_orders.partId`, which the create API never sets —
   non-goal 10). Always ask "can any shipped endpoint produce the state this
   feature consumes?" rather than trusting the plan.

See [[review-verification-environment]] for how to actually run the suites.
