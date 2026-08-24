---
name: review-verification-environment
description: How to actually exercise Mobius changes during review — starting the API, psql binary, auth rate-limit cooldown, mutation and concurrency harnesses
metadata:
  type: project
---

Reviews must run the code, not read it. Environment facts that make that possible here:

- mobius-api is often **not** running. Start it yourself:
  `cd repos/mobius-api && SQL_HOST=localhost PORT=3001 npm run start:dev` (the checked-in `.env`
  points `SQL_HOST` at the deployed host `traffic-postgres`). Kill only that process afterwards
  (L-015). 3005 is boletosx's API; 3000 is a parsons/tak app, not the CRA web-app.
- **The web-app browser ACs ARE runnable — start the CRA on a free port and widen CORS.**
  `cd repos/mobius-web-app && PORT=3456 BROWSER=none npm start`, then restart the API with
  `CORS_ALLOWED_ORIGINS="http://localhost:3456,localhost"` or every request dies in preflight with
  no `Access-Control-Allow-Origin` and the login page just says "credenciales inválidas".
  Then drive it with `repos/debug/helpers/{browserHelper,authHelper}.js` (`launchBrowser({headless:'new'})`)
  and click the sidebar entry for real — that is the L-011 evidence implementers keep deferring.
- `psql` is not on PATH; it lives at `/opt/homebrew/opt/postgresql@16/bin/psql`.
  Local DB: `-h localhost -U traffic_user -d traffic_production` (password `simple123`).
- `repos/tests` runner: `node node_modules/jest/bin/jest.js --config=jest.config.js <path>`
  (the `.bin/jest` shim has no execute bit). `SQL_HOST=localhost` is needed for suites that shell
  out to psql for fixtures.
- **authRateLimiter is 5 logins/min per IP, keyed `ip:<addr>:auth`, NOT env-overridable.** A suite
  spending 4 logins needs roughly **two minutes of ZERO traffic** before it can run again — and a
  single `curl POST /api/auth/login` probe burns budget, so "probe then run" makes it worse.
  The reliable fix is **restarting the API**: the limiter store is in-memory, so a restart zeroes
  every bucket instantly. Waiting does not work when a parallel session is also logging in
  (reviews are sometimes run concurrently, one per sprint feature, against this one shared DB —
  expect foreign `*-<base36 ts>@test.local` fixture users and do not blame them on your branch).
- **Baseline pre-existing failures before blaming a branch.** `git worktree add <scratch> HEAD`,
  symlink `node_modules`, run the same suite there.
- **Mutation-checking without editing the repo (L-018):** copy the unit under test to the
  scratchpad, compile with `npx tsc … --module commonjs`, mutate with `perl -0pi`, drive from a
  node script. When that is too heavy, prove the mutation logically: grep that the guard's
  sentinel value has exactly one producer and one consumer.
- **Concurrency claims can be tested cheaply and read-only.** Require the repo's own `knex` from
  its `node_modules`, then:
  - nested `trx.transaction(cb)` in knex 3.1.0 really emits `SAVEPOINT` / `ROLLBACK TO SAVEPOINT`,
    so a swallowed SQL error does NOT poison the outer transaction (verified 2026-08-21);
  - build ABBA deadlocks with `pg_advisory_xact_lock(a)` / `(b)` on two transactions — no schema
    or data is touched, and Postgres raises `40P01` exactly as it would on row locks.

**Why:** implementer "verified" claims in this workspace are frequently partial (manual-puppeteer
ACs get deferred), so the reviewer is the first person to actually run the suites.
**How to apply:** run the unit suite, the `repos/tests` API suite and any parity suite yourself
before writing a verdict; check the DB afterwards for droppings (L-013) and clean up what your
own runs left behind.

See [[recurring-review-findings]].
