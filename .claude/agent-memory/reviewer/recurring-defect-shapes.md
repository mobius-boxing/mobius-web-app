---
name: recurring-defect-shapes
description: Defect shapes found more than once in mobius feature work — Express 5 undefined req.body, seed-migration down() over-deletion, unexercised puppeteer ACs, incomplete PG error-code maps, one-call-site fixes
metadata:
  type: project
---

Check these explicitly; each has been found in a real review here.

**1. Express 5 leaves `req.body` undefined.** The API is on `express@^5`, where
`express.json()` does NOT default `req.body` to `{}` — a request with no body or a
non-JSON content-type leaves it `undefined`. A handler doing
`const { action } = req.body;` throws a `TypeError`, and `error.middleware`
answers **500 with the raw TypeError text echoed to the client** (the `message`
field is not gated on `DEBUG_ERRORS`). The house-correct form is
`const action = (req.body ?? {}).action;`. Verified live 2026-08-21 on
`PATCH /sales-orders/:uuid/approval/:machine`; the sibling `setFulfillment` in the
same file got it right, so grep the whole file, not just the new method.

**2. Seed migrations whose `down()` re-resolves instead of remembering.** The
pattern `resolvePairs(knex)` used by both `up()` and `down()` is idempotent for
`up()` (`onConflict().ignore()`) but makes `down()` delete every currently
resolvable row — including rows a human or ETL created before the migration ran,
which `up()` silently conflict-ignored. Specs usually say "down() deletes only the
rows it inserted"; re-resolution is not that. Proof technique: run
`up(); up(); down()` inside a rolled-back transaction and compare counts — if
`up()` inserted 0 and `down()` deleted N, the finding is demonstrated.

**3. Manual/puppeteer ACs are the usual gap, not the code.** Feature work lands
type-clean, unit-tested and INT-green; what is missing is the browser AC. Scripts
under `repos/debug/**` are frequently written, syntax-checked and never executed
("the review phase's"). Treat an unexecuted script as an unverified AC, and try to
run it yourself — see [[verification-environment]] for why it usually fails for
environmental reasons rather than product ones.

**4. `sanitizeResponse` already strips `id` and numeric `*Id` globally**
(`middlewares/sanitize-response.middleware.ts`, mounted in `app.ts`). A DAO that
re-attaches the numeric id for an L-005 guard is not leaking it. Do not report it.

**5. `error.middleware.ts`'s PG-code map is always one code short, and the miss is
an SQL-disclosure 500.** The generic fallthrough echoes `err.message` unconditionally
(no `DEBUG_ERRORS` gate) and knex prefixes that message with the whole generated
statement. `CLIENT_DATA_EXCEPTIONS` currently holds 22P02/22007/22008/22003 and
misses **22001** (value too long for varchar — e.g. `models.code` is `varchar(100)`
with no DTO length check) and **22009** (time-zone displacement out of range).
The SQLSTATE depends on HOW the value reaches PG, so measure it, never assume:
with the repo's own knex, `new Date('-271821-04-20T00:00:00.000Z')` bound as a
**Date object** → `22008` (mapped, 400), but the same value bound as a **raw
string** → `22009` (unmapped, 500 + SQL). DTOs here validate dates with a
`Number.isNaN(new Date(v).getTime())` check and then store the raw string, so the
body/write path and the query-filter path land on different codes.

**6. A ratified fix lands on one call site and misses its sibling.** Every fix wave
so far fixed the instance named in the finding and left the twin: `setApproval`
guarded but `setFulfillment`/`setVoid` not, `SalesOrdersGrid` using the new
`formatBusinessDate` while `ProductionOrdersGrid` keeps its local
`toLocaleDateString`, `SalesOrderLifecycleControl` using the new cancel-direction
confirm strings while `SalesOrderLifecycleQuickActions` keeps the void-direction one.
Grep the whole repo for the *pattern* being fixed, not the file that was reported.
