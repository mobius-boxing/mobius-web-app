---
name: verification-environment
description: How to independently verify mobius web-app + API changes on this box — local Postgres creds, occupied port 3000, the 5/min auth limiter that makes INT and puppeteer runs flaky
metadata:
  type: reference
---

Independent verification is cheap here, but four environment facts cost a
review round each time they are rediscovered.

**Local Postgres is real and reachable.** `psql` exists at
`/opt/homebrew/opt/postgresql@16/bin/psql`; `traffic_user` / `traffic_production`
on `localhost:5432` do exist (password is in `repos/mobius-api/.env`
`SQL_PASSWORD`). The localhost-guarded suites
(`src/__tests__/db/*.db.test.ts`, `ownership.schema.test.ts`) run with
`SQL_HOST=localhost SQL_PORT=5432 SQL_USER=… SQL_PASSWORD=… SQL_DATABASE=… npx jest <file>`
— all five vars, not `SQL_HOST` alone.

**Port 3000 is NOT the mobius web app.** Another product ("iNET® Operations
Center") listens there, and CRA binds `[::1]` only. Any `repos/debug/**` script
that defaults to `APP_URL=http://localhost:3000` will log in to the wrong app and
report "email input not found". Start the app yourself with
`BROWSER=none PORT=3100 REACT_APP_API_URL=http://localhost:3001 npx react-scripts start`
(~60 s) and pass `APP_URL=http://localhost:3100`; kill only that pid afterwards
(L-015).

**`authRateLimiter` is 5 requests / 1 minute keyed by IP+route.** INT suites that
log in 3 times in `beforeAll` (admin, superAdmin, a scratch user) plus your own
curl logins blow the window, and the failure surfaces as a cascade of 401s from
`POST /users` or a 429 on the last login — not as an obvious rate-limit error.
Wait a full minute with zero login traffic before each run, and re-run before
concluding a suite is broken. Parallel agents on the same box share the bucket.

**The local API on :3001 belongs to someone else.** It gets SIGTERMed mid-review
by other sessions; a puppeteer/INT run failing with `fetch failed` usually means
the API died, not that the code is wrong. Check `curl localhost:3001/api/health`
before believing a failure.

**Suite baselines (measured 2026-08-21, feature/sprint3-pedidos-core).** mobius-api
`npx jest` with the five SQL_* vars: **1051 passed / 3 skipped, 63 suites, ~5 s**.
mobius-web-app `CI=true npx react-scripts test --watchAll=false`: **152 failures in
15 page suites are PRE-EXISTING** (`useCompany must be used within a CompanyProvider`
— those suites render pages without the provider) and reproduce identically on a
`git worktree` of HEAD. Never attribute them to the branch; diff the *suite list*,
not the totals. `--json --outputFile=…` is the only reliable way to get per-suite
results, since `--silent` floods stdout with DOM dumps.

**Verifying a claimed PG SQLSTATE without a server:** require the repo's own knex from
its `node_modules`, connect to localhost and run `knex.raw('select ?::timestamptz',[v])`
with both the Date object and the raw string. Deadlock claims: two `knex.transaction`s
taking `SELECT … FOR UPDATE` on two rows of an existing table in opposite order, both
ending in a throw so everything rolls back — no writes, no schema changes. Measured
this way: a `40P01` raised inside a nested `trx.transaction` (SAVEPOINT) does **not**
poison the outer transaction, and a retry on the same handle succeeds.

**Mutation-checking without editing the repo:** `cp -R src` + `cp jest.config.js
tsconfig.json package.json` into the scratchpad, `ln -s` the real `node_modules`,
mutate the copy, run `npx jest` from there. Works unmodified for mobius-api.

**Exercising a migration without persisting it:** import the migration file with
`ts-node/register`, run `up()`/`up()`/`down()` inside one `knex.transaction`, and
throw at the end to roll back. Proves idempotency and `down()` blast radius
against real data with zero writes.
