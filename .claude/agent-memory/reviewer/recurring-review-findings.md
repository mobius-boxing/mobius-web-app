---
name: recurring-review-findings
description: Defect patterns that keep recurring in Mobius feature work — check each one explicitly on every new entity/endpoint review
metadata:
  type: project
---

Standing checklist of issues that have shown up repeatedly in this workspace.

- **Which ACs are self-satisfying.** `sanitizeResponse` strips `id` and every numeric `*Id` key
  from *all* responses, so "uuid-only payload" ACs pass even when the DAO's `mapToInterface`
  still returns `companyId`. Verify the DAO, not just the response.
- **`getCompanyFilterUuid(req)` is the wrong scope for FK validation on create.** For a
  superAdmin with no `?companyId=` it returns `undefined`, so lookup-FK resolution runs
  unscoped even though the row is being written into a specific company (from
  `getCompanyForCreate`). Cross-tenant FKs land silently. Same bug shape on update.
- **`foreignKeyResolver.getIdByUuid` passes numeric strings straight through** — so a bogus
  `"5"` "resolves" and then blows up as a Postgres 22P02 (500 instead of 400) when written to a
  `uuid` column. Use `validateUuidExists` when the field is a uuid handle.
- **`BaseCrudController`'s `fkCatchOnDelete` answers 400**, so a controller that pre-checks and
  answers 409 has two different codes for the same condition on the TOCTOU path.
- **`repos/mobius-api/uploads/` is not gitignored.** Any suite that uploads a file and then
  deletes the `files` row by SQL orphans the bytes on disk and pollutes `git status` (L-013,
  and L-006's "SQL/cascade bypasses DAO cleanup" shape). Delete files via `DELETE /files/:uuid`.
- **Nested `<Modal>` inside `<Modal>`** — both register a `document` keydown Escape listener and
  both toggle `document.body.style.overflow`, so Escape closes the parent form too. There is only
  one place in the repo doing this; treat it as a smell.
- **Undisclosed micro-deviations from the spec's schema table** (e.g. `timestamps(true,true)` vs
  explicit camelCase `createdAt`/`updatedAt`) — usually the spec is wrong and the code is right,
  but it belongs in the Deviations list.
- **Query-builder filter configs that expose internal numeric ids** (`flapTypeId`,
  `complementId`) alongside the uuid filters — accepted-and-working, but off-convention for a
  uuid-only API.

- **Reset / "Limpiar" handlers miss `useEntityList`'s own state.** Filter bars keep their controls
  in one local object and call `list.setFilters(...)`, but `search`, `sortBy` and `sortOrder` live
  *inside* the hook. A Clear button that only restores the local object leaves the search term in
  the box and still sends `search=` on the next request. `clearFilters()` is the hook's own reset
  and is almost never wired. Check any "restores the mount-time state" AC against `search`.
- **The registry's wrong-database guard does not proxy the query builder**, so `.join()` /
  `.leftJoin()` across a database boundary is invisible to it (`db("erp")` joining core-owned
  `users` or `companies`). It only catches `db(key)("table")`. Cross-DB joins are latent 42P01s
  at the core cutover, and three DAOs plus `applyCompanyUuidScope` carry them today — do not let
  an implementer claim "the cross-database read is fixed" on the strength of a passing test.


- **`afterAll` cleanup keyed on variables assigned *after* a fragile step leaks rows.** The
  `repos/tests` API suites create users/companies in `beforeAll`, then delete them in `afterAll`
  by `email IN ('${aEmail}', '${bEmail}')`. Those variables are assigned only after the *login*
  that follows `POST /users` — and that login is exactly what 429s when the auth budget is spent.
  An aborted `beforeAll` therefore runs `DELETE … WHERE email IN ('','')` and orphans real rows
  (reproduced twice on sales-orders-lifecycle). Demand deletion by the deterministic `RUN` suffix
  (`email LIKE 'x-%-${RUN}@test.local'`), not by post-hoc variables. L-013.
- **A savepoint that swallows failures also swallows `40P01`.** Any "failures are swallowed and
  logged" service running inside `trx.transaction(...)` will absorb a *deadlock*, let the outer
  transaction commit, and lose the derived write permanently with only a `console.error`. Whenever
  a plan says "deadlock → 500, accepted", check which side actually raises: the side that swallows
  gets a silent lost update, not a 500. Fix is a consistent global lock order, or a retry on
  `40P01`/`40001`.
- **Never let a spec-mandated `sensitiveRateLimiter` be downgraded to `apiRateLimiter`.** The
  shared `sensitive` bucket really is 3 per 5 min for ALL such routes combined, so the objection is
  usually valid — but the repo's established answer is a dedicated per-route bucket
  (`sensitiveUserDeletionRateLimiter`, `sensitiveCountdownDeletionRateLimiter`, … all 10/5 min,
  each with its own `routeKey`). Downgrading to 600/15 min is a silent security relaxation.
- **Router unit suites mock the controller with a hardcoded object literal**, so every route a
  later feature appends makes an earlier feature's router test throw
  `Cannot read properties of undefined (reading 'bind')` at construction. Expect — and accept —
  a two-line stub edit outside the plan's Changes table; reject an arrow-wrapper "fix" in the
  router, which converts a construction-time failure into a runtime 500.

- **Date-range list filters 500 AND leak the SQL.** `error.middleware.ts` maps PG `22P02` to a
  400 but has NO branch for `22007` (invalid datetime), so it falls through to the generic
  handler which echoes `err.message` — the full knex SQL with table/column names — to the client.
  Any DAO doing `q.where(col, ">=", new Date(rawQueryParam))` in `applyExtra` therefore turns
  `?deliveryDateFrom=xx` into a 500 + schema disclosure. Probe every new list endpoint with
  `?<dateParam>=xx`. Fix: `sales-order.dao.ts` already exports `parseDateParam` and
  `assertUuidParam` (throw → 400); reuse them instead of writing another `new Date(v)`.
  (Found in production-order-generation, 2026-08-21; the uuid and numeric-id filters happen to
  land on 400 only because 22P02 *is* mapped.)
- **Enum-valued filters silently ignore out-of-range values.** `?schedulingState=bogus` → 200 with
  the predicate dropped. Wired-but-value-ignored is the L-007 shape one level down; ask for a 400.

**Why:** these are the findings that survived verification across reviews; the rest were noise.
**How to apply:** walk this list before writing the Quality-audit section of a review.

See [[review-verification-environment]].
