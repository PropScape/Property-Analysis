# Project State

> **Last Updated:** 2026-05-19

## Current Phase

**Feature Development — Wizard Steps 1–4 complete**

Project scaffold, auth, and project-overview are implemented. Wizard steps 1–4
are live with DB persistence. Domain calculation layer extracted. Config layer
introduced. Ready for Step 5 (Sanierungsmaßnahmen).

## Active Work

- SPEC-PROJECT-LIST v1.0.0 — ✅ Implemented (live DB, RLS-protected delete)
- SPEC-AUTH v1.0.0 — ✅ Implemented
- SPEC-WIZARD-START v1.0.0 — ✅ Implemented (Step 1: intent + experience)
- SPEC-WIZARD-STEP2 v1.0.0 — ✅ Implemented (Allgemeine Objektdaten)
- SPEC-WIZARD-STEP3 v1.0.0 — ✅ Implemented (Kaufpreis & Miete, live KPI sidebar)
- SPEC-WIZARD-STEP4 v1.0.0 — ✅ Implemented (Kaufnebenkosten, receipt sidebar)
- Next: SPEC-WIZARD-STEP5 (Sanierungsmaßnahmen)

## ⚠️ Standing Rules (read before every session)

- **Next.js 16 uses `proxy.ts`, NOT `middleware.ts`.** Never create `src/middleware.ts` — it causes a runtime crash. All edge logic lives in `src/proxy.ts`. See ADR-007.
- **Monetary values are integer cents.** Never store or calculate EUR floats in the domain layer. See `domain/calculations/currency.ts`.
- **Config layer rule (ADR-008):** Before adding ANY constant, default value, or lookup table to a component or calculation module, ask: _Does this belong in `src/config/`?_
  - Regulatory / reference data (tax rates, fee schedules) → `src/config/`
  - User-overridable form defaults → `src/config/wizard-defaults.ts`
  - Pure computation logic → `src/domain/calculations/`
  - Magic numbers in a UI component → **violation**
- **Domain layer rule (ADR-004):** `src/domain/` may import from `src/config/` and `zod` only. Never import `react`, `next`, or Supabase clients.
- **Spec-first (SDD §2):** No code before the spec exists in `docs/specs/`. Every step gets `SPEC-WIZARD-STEPn.v1.0.0.md` with Gherkin ACs before any component is touched.
- No hardcoded strings — use German copy inline for now (i18n migration later).

## Blockers

- None.

## Recent Changes

| Date | Change |
|---|---|
| 2026-05-19 | ADR-008: config layer documented; ESLint restriction added; state.md standing rules enforced |
| 2026-05-19 | refactor(config): wizard-defaults.ts + bundesland.ts — all hardcoded defaults removed from forms |
| 2026-05-19 | refactor(domain): domain/calculations/ layer — currency, rental-kpis, acquisition-costs (118 tests) |
| 2026-05-19 | SPEC-WIZARD-STEP4 v1.0.0: Kaufnebenkosten — standard %-fields, Bundesland dropdown (16 states), custom item repeater, live receipt sidebar card |
| 2026-05-19 | SPEC-WIZARD-STEP3 v1.0.0: Kaufpreis & Miete — currency inputs (cents), vacancy slider, rent-growth toggle, live KPI sidebar (gross yield, annual rent, price factor), 19 schema tests |
| 2026-05-19 | SPEC-WIZARD-STEP2 v1.0.0: Allgemeine Objektdaten — property type, location, area, year built, occupancy, condition, DB hydration on reload |
| 2026-05-19 | SPEC-WIZARD-START v1.0.0: Step 1 intent/experience, WizardStepper, StepFooter, Zustand store with persist, Server Actions |
| 2026-05-19 | DB integration: Project overview live (Supabase joins), wizard steps reload-safe (DB = source of truth), deleteAnalysisAction with RLS |
| 2026-05-19 | SPEC-AUTH v1.0.0: email/password auth, email confirmation, route guards, AppHeader user menu, LoginForm, RegisterForm, verify-email page, 8 unit tests, 10 E2E tests |
| 2026-05-19 | Supabase setup: JS packages, server/browser/middleware clients, database.types.ts, SQL migration, Supabase CLI config, CI db-types job |
| 2026-05-19 | SPEC-PROJECT-LIST implemented: project overview page, analysis cards, stat cards, empty state, delete flow. 13 unit tests, 9 E2E tests. |
| 2026-05-18 | Project initialization: Next.js 16, Tailwind v4, Shadcn UI, Vitest, Playwright, Husky, CI. |
| 2026-05-18 | Project inception. Governance scaffold created. |
