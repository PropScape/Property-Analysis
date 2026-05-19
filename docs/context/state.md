# Project State

> **Last Updated:** 2026-05-19

## Current Phase

**Feature Development**

Project scaffold complete. SPEC-PROJECT-LIST implemented with mock data.
Supabase connected (EU/Frankfurt). Supabase CLI configured.
Ready for auth integration and wizard implementation.

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
- All monetary values are stored as **integer cents** (never floats).
- No hardcoded strings — use German copy inline for now (i18n migration later).

## Blockers

- None.

## Recent Changes

| Date | Change |
|---|---|
| 2026-05-19 | SPEC-WIZARD-STEP4 v1.0.0: Kaufnebenkosten — standard %-fields, Bundesland dropdown (16 states), custom item repeater, live receipt sidebar card, 19 schema tests |
| 2026-05-19 | SPEC-WIZARD-STEP3 v1.0.0: Kaufpreis & Miete — currency inputs (cents), vacancy slider, rent-growth toggle, live KPI sidebar (gross yield, annual rent, price factor), 19 schema tests |
| 2026-05-19 | SPEC-WIZARD-STEP2 v1.0.0: Allgemeine Objektdaten — property type, location, area, year built, occupancy, condition, DB hydration on reload |
| 2026-05-19 | SPEC-WIZARD-START v1.0.0: Step 1 intent/experience, WizardStepper, StepFooter, Zustand store with persist, Server Actions |
| 2026-05-19 | DB integration: Project overview live (Supabase joins), wizard steps reload-safe (DB = source of truth), deleteAnalysisAction with RLS |
| 2026-05-19 | SPEC-AUTH v1.0.0: email/password auth, email confirmation, route guards, AppHeader user menu, LoginForm, RegisterForm, verify-email page, 8 unit tests, 10 E2E tests |
| 2026-05-19 | Supabase setup: JS packages, server/browser/middleware clients, database.types.ts, SQL migration, Supabase CLI config, CI db-types job |
| 2026-05-19 | SPEC-PROJECT-LIST implemented: project overview page, analysis cards, stat cards, empty state, delete flow. 13 unit tests, 9 E2E tests. |
| 2026-05-18 | Project initialization: Next.js 16, Tailwind v4, Shadcn UI, Vitest, Playwright, Husky, CI. |
| 2026-05-18 | Project inception. Governance scaffold created. |
