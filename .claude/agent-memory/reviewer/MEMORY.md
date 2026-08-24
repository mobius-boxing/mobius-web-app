# Memory Index

- [Verification environment](verification-environment.md) — local PG creds, port 3000 is another app, the 5/min auth limiter, suite baselines (API 1051; web 152 pre-existing failures), knex SQLSTATE/deadlock harnesses
- [Recurring defect shapes](recurring-defect-shapes.md) — Express 5 undefined `req.body` ⇒ 500, seed-migration `down()` over-deletion, unexecuted puppeteer ACs, incomplete PG error-code map (22001/22009), one-call-site fixes
