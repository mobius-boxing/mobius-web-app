# Project instructions

<!-- Keep this file under ~100 lines. It pays token rent every session.
     Deep style rules live in .claude/skills/code-style/ (loaded on demand).
     Lessons live in .claude/lessons/ (indexed, loaded selectively).
     Mechanical rules live in hooks/linters, not here. -->

## Commands
- Build: `npm run build` (react-scripts)
- Test (all): `npm test -- --watchAll=false`
- Test (single file): `npm test -- --watchAll=false src/path/to/File.test.tsx`
- Lint + format: none configured (CRA's embedded eslint runs inside start/build/test; no prettier)
- Dev server: `npm start`; deploy: `npm run deploy`

## Structure
- CRA (react-scripts 5) + TypeScript + Tailwind; entry `src/index.tsx`, root `src/App.tsx`
- `src/pages/` — route-level screens (react-router-dom)
- `src/components/` — shared UI components
- `src/contexts/`, `src/hooks/` — state and reusable logic
- `src/services/` — axios API clients; `src/types/` — shared types; `src/utils/` — helpers (use `src/utils/logger.ts`, `no-console` is enforced)
- `src/i18n/` — i18next translations
- `src/__tests__/`, `src/__mocks__/`, `src/test-utils/`, `src/setupTests.ts` — jest + testing-library
- `public/` — static assets; `tailwind.config.js` / `postcss.config.js` at root

## Rules
- Before planning or implementing anything, read `.claude/lessons/INDEX.md`.
  Open ONLY the topic files whose tags match the current task. Treat
  applicable lessons as hard requirements.
- Never write to `.claude/lessons/` directly. Lessons are captured only via
  the `/lesson` command and curated only via `/lessons-gc`.
- Feature work on existing code goes through `/feature`. Prototypes through
  `/proto`. Large refactors/migrations through `/refactor`.
- Reuse existing utilities before writing new ones. Duplication found in
  review is a rejected change.

<!-- PROMOTED LESSONS: /lessons-gc may add a maximum of ~5 one-liners below
     this line. Anything more belongs in the lessons system. -->
