# Immoverse — Architecture

> **Status:** ✅ Decisions Finalized
> **Date:** 2026-05-18
> **Pattern:** Clean Architecture (Domain-Centric)

This document captures the architectural decisions for the Immoverse real estate
investment analysis application — a B2C tool that guides German consumers
through a 16-step property investment analysis.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Wizard Steps │  │ Project List │  │  Expert Dashboard    │  │
│  │  (1–15)      │  │              │  │  (Charts + Tables)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│  ┌──────▼─────────────────▼──────────────────────▼───────────┐  │
│  │                  Zustand Store                            │  │
│  │         (localStorage persistence)                        │  │
│  └──────────────────────┬────────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────────┘
                          │ Server Actions (save / load / delete)
┌─────────────────────────▼──────────────────────────────────────┐
│                     Next.js Server                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Server Actions                          │  │
│  │     (thin orchestration: validate → persist → respond)   │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │                  Domain Layer                            │  │
│  │   Calculations · Zod Schemas · Business Rules · Types    │  │
│  │              ⚠ ZERO framework dependencies               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │                  Supabase (EU/Frankfurt)                 │  │
│  │          PostgreSQL · Auth · Storage · RLS               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Clean Architecture Layers

### 2.1 Domain Layer (`src/domain/`)

**The heart of the application.** Contains all financial calculation logic,
business rules, validation schemas, and domain types.

**Critical constraint:** This directory must have **zero** imports from `react`,
`next`, `@supabase/*`, `zustand`, or any framework. Only pure TypeScript and
`zod` are permitted. See [ADR-004](adr/ADR-004-clean-architecture.md).

```
src/domain/
├── calculations/
│   ├── cashflow.ts          # Pre/post-tax cashflow computation
│   ├── depreciation.ts      # AfA (tax depreciation) calculation
│   ├── financing.ts         # Annuity, interest, amortization
│   ├── roi.ts               # Bruttorendite, Nettorendite, EK-Rendite
│   ├── acquisition-costs.ts # Kaufnebenkosten (notary, tax, broker)
│   ├── stress-test.ts       # Scenario simulation (vacancy, rate change)
│   └── index.ts             # Barrel export
├── schemas/
│   ├── general-property.ts  # Step 2 validation
│   ├── purchase-price.ts    # Step 3 validation
│   ├── financing.ts         # Step 5 validation
│   ├── ...                  # One schema per step
│   └── analysis.ts          # Full analysis aggregate schema
├── types/
│   ├── analysis.ts          # Analysis, AnalysisStep types
│   ├── calculations.ts      # Input/output types for calculations
│   └── result.ts            # Result<T> pattern type
├── rules/
│   ├── constants.ts         # German tax rates, legal limits, defaults
│   └── validation.ts        # Cross-step validation rules
└── index.ts                 # Barrel export
```

**Pattern:** All calculation functions follow this signature:

```typescript
export function calculateX(input: XInput): Result<XOutput> {
  const parsed = xInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.message };
  // ... pure computation (integer cents for money)
  return { success: true, data: result };
}
```

### 2.2 Application Layer (`src/stores/`, `src/actions/`)

Orchestrates domain logic and manages application state.

- **Zustand stores** (`src/stores/`): Wizard state with localStorage
  persistence. See [ADR-005](adr/ADR-005-zustand-wizard-state.md).
- **Server Actions** (`src/actions/`): Thin functions that validate input
  (via domain schemas), call Supabase, and return `Result<T>`. Never contain
  business logic directly.

### 2.3 Infrastructure Layer (`src/lib/supabase/`)

Supabase client configuration for server and browser contexts. Isolated behind
a clean interface so it can be swapped if the backend changes.

### 2.4 UI Layer (`src/app/`, `src/components/`, `src/hooks/`)

Next.js pages, React components, and hooks. May import from all other layers.
Follows the design system in [`design-system.md`](design-system.md).

---

## 3. Data Model (Normalized)

See [ADR-002](adr/ADR-002-supabase.md) for the full rationale.

### 3.1 Tables

```
┌─────────────────────┐       ┌──────────────────────────┐
│     auth.users      │       │        analyses          │
│─────────────────────│       │──────────────────────────│
│ id (UUID, PK)       │──┐    │ id (UUID, PK)            │
│ email               │  │    │ user_id (UUID, FK) ──────│──┐
│ ...                 │  │    │ name (TEXT)               │  │
└─────────────────────┘  │    │ status (TEXT)             │  │
                         │    │ current_step (INTEGER)    │  │
                         │    │ created_at (TIMESTAMPTZ)  │  │
                         │    │ updated_at (TIMESTAMPTZ)  │  │
                         │    └──────────┬───────────────┘  │
                         │               │                  │
                         │    ┌──────────▼───────────────┐  │
                         │    │    analysis_steps         │  │
                         │    │──────────────────────────│  │
                         │    │ id (UUID, PK)            │  │
                         │    │ analysis_id (UUID, FK) ──│──┘
                         │    │ step_number (INTEGER)    │
                         │    │ step_data (JSONB)        │
                         │    │ completed_at (TIMESTAMPTZ│
                         │    │ created_at (TIMESTAMPTZ) │
                         │    │ updated_at (TIMESTAMPTZ) │
                         │    └─────────────────────────┘
                         │
                         └── RLS: auth.uid() = user_id
```

### 3.2 Step Data Structure (JSONB per step)

Each step's `step_data` column stores the validated form data for that step:

| Step | Name | Key Fields in `step_data` |
|---|---|---|
| 1 | Start | `{ intent, experience_level }` |
| 2 | General Property | `{ property_type, location, year_built, condition }` |
| 3 | Purchase Price | `{ purchase_price_cents, broker_percent, notary_percent, land_tax_percent }` |
| 4 | Rental Income | `{ monthly_cold_rent_cents, vacancy_rate_percent }` |
| 5 | Financing | `{ loan_amount_cents, interest_rate_percent, amortization_rate_percent, fixed_period_years }` |
| 6 | Operating Costs | `{ management_fee_cents, maintenance_reserve_cents }` |
| 7 | Tax & Income | `{ personal_tax_rate_percent, annual_income_cents }` |
| 8 | Depreciation | `{ building_share_percent, depreciation_rate_percent, depreciation_years }` |
| 9 | Improvements | `{ planned_improvements: [{ description, cost_cents }] }` |
| 10 | Value Appreciation | `{ annual_appreciation_percent }` |
| 11 | Exit Strategy | `{ planned_hold_years, selling_costs_percent }` |
| 12 | Reserves & Buffers | `{ monthly_reserve_cents, emergency_fund_cents }` |
| 13 | Stress Test Config | `{ scenarios: [{ type, parameter, value }] }` |
| 14 | Summary Review | `{ confirmed: boolean }` |
| 15 | Final Cashflow/KPIs | _(read-only, computed from steps 1–14)_ |
| 16 | Expert Dashboard | _(read-only, full analysis view)_ |

---

## 4. Authentication & Security

**Provider:** Supabase Auth (email/password, magic link, Google, Apple).
See [ADR-002](adr/ADR-002-supabase.md).

### 4.1 Auth Flow

1. User signs up or logs in via Supabase Auth.
2. Supabase sets an HTTP-only session cookie (managed by `@supabase/ssr`).
3. Next.js middleware validates the session on every request.
4. Protected routes (`/analysis/*`, `/dashboard/*`) redirect to login if
   unauthenticated.

### 4.2 Row-Level Security (RLS)

```sql
-- Users can only read/write their own analyses
CREATE POLICY "Users own analyses" ON analyses
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access steps of their own analyses
CREATE POLICY "Users own steps" ON analysis_steps
  FOR ALL USING (
    analysis_id IN (SELECT id FROM analyses WHERE user_id = auth.uid())
  );
```

### 4.3 GDPR Compliance

| Requirement | Implementation |
|---|---|
| EU data residency | Supabase Frankfurt region |
| Right to deletion | Server Action: delete all user data + Supabase Auth account |
| Data export | Server Action: export all analyses as JSON |
| No PII in logs | Structured logging without email/name fields |
| Consent | Cookie consent banner, privacy policy page |

---

## 5. Wizard Architecture

### 5.1 Routing

```
/                           → Project list (all analyses)
/analysis/new               → Create new analysis → redirect to step 1
/analysis/[id]/step/[n]     → Wizard step n (1–16)
/analysis/[id]/dashboard    → Expert dashboard (step 16 alias)
```

### 5.2 State Flow

```
User Input → Zustand Store → localStorage (auto-persist)
                           → Domain Functions (real-time calculation preview)
                           → Server Action → Supabase (explicit save)
```

### 5.3 Navigation Rules

- Steps 1–14: data entry, editable.
- Step 15: Final Cashflow/KPIs — read-only summary, computed from steps 1–14.
- Step 16: Expert Dashboard — full analysis with charts, tables, audit log.
- Users can navigate to any completed step. Cannot skip ahead to incomplete
  steps.

---

## 6. Testing Strategy

See [ADR-006](adr/ADR-006-testing-strategy.md).

| Level | Tool | Scope | Target |
|---|---|---|---|
| Unit | Vitest | `src/domain/` — calculations, schemas, rules | 100% coverage |
| Component | React Testing Library + Vitest | UI components with logic | Critical interactions |
| E2E | Playwright | Full wizard flow, auth, save/load | All Gherkin ACs |

**Non-negotiable:** No feature ships without tests. Domain calculation functions
require 100% test coverage.

---

## 7. Internationalization (i18n)

See [ADR-001](adr/ADR-001-nextjs-app-router.md).

- **Library:** `next-intl`
- **Default locale:** `de` (German)
- **Future locales:** `en` (English)
- **Message files:** `src/i18n/messages/de.json`
- **Rule:** All user-facing text uses translation keys. No hardcoded strings
  in components.

---

## 8. Deployment

- **Platform:** Vercel
- **Preview deploys:** Automatic on PR creation
- **Production:** Auto-deploy from `main` branch
- **Environment variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## 9. Feature Roadmap

| # | Feature | Phase | Spec ID |
|---|---|---|---|
| F1 | Welcome / Start screen | MVP | `SPEC-WIZARD-START` |
| F2 | Steps 2–14 (data entry) | MVP | `SPEC-WIZARD-STEPS` |
| F3 | Step 15: Final Cashflow/KPIs | MVP | `SPEC-CASHFLOW-SUMMARY` |
| F4 | Step 16: Expert Dashboard | MVP | `SPEC-DASHBOARD` |
| F5 | Analysis CRUD (save/load/delete) | MVP | `SPEC-ANALYSIS-CRUD` |
| F6 | Project overview (analysis list) | MVP | `SPEC-PROJECT-LIST` |
| F7 | User authentication | MVP | `SPEC-AUTH` |
| F8 | Analysis comparison | Post-MVP | — |
| F9 | PDF export | Post-MVP | — |
| F10 | Dark mode | Post-MVP | — |
| F11 | Mobile apps (iOS/Android) | Future | — |

> Each MVP feature must have a spec in `docs/specs/` before implementation
> begins.

---

## 10. Architectural Principles

These principles govern all **code-level** decisions. For UI-specific rules see
[`design-system.md`](design-system.md).

| Principle | Rule |
|---|---|
| **Domain Purity** | `src/domain/` has zero framework imports. Pure TypeScript + Zod only. Portable to any runtime. |
| **Strict Separation** | UI components never talk to the database directly. All mutations go through Server Actions. All reads go through server components or Server Actions. |
| **Type Safety** | No implicit `any`. TypeScript `strict: true`. Zod for runtime validation of all external inputs. |
| **Result Pattern** | All Server Actions and domain functions return `Result<T>`. Never throw. Never fail silently. |
| **Server State First** | Prefer RSC and server-side data fetching. Client state is reserved for wizard form data (Zustand) and UI toggles. |
| **Financial Precision** | All monetary values are integer cents. No floating-point EUR. |
| **Secure by Design** | RLS at database level. Validate all inputs. Sanitize all outputs. No PII in logs. |
| **i18n from Day One** | All user-facing text uses `next-intl` keys. No hardcoded strings. |
| **Tests are Mandatory** | No feature ships without unit tests (domain) and E2E tests (user flows). |

---

## 11. Development Workflow

All changes follow a **spec-driven** workflow. See the global
[GEMINI.md](../.gemini/GEMINI.md) for the full SDD process.

### Phase 1: Analysis & Spec

1. Analyze the impact of the request.
2. Check `docs/specs/` for existing specifications.
3. **Scan `docs/adr/`** for constraints that may affect the approach.
4. Ask clarifying questions if requirements are vague.
5. Outline a **Technical Plan** before writing any code.

**If no spec exists for this task:** STOP. Draft a Delta Spec in `docs/specs/`
with a Spec ID (`SPEC-<FEATURE>`), version `1.0.0`, and Gherkin acceptance
criteria before proceeding.

### Phase 2: Implementation

1. Write code in small, atomic batches.
2. Add **JSDoc** to all exported functions explaining _what_ and _why_.
3. Ensure all new code follows the architectural principles above.
4. Reference the Spec ID in all git commits.

### Phase 3: Review & Refine

Before finishing, run a self-review checklist:

- [ ] Did I handle the error case (Result pattern)?
- [ ] Is this accessible (ARIA)?
- [ ] Did I add JSDoc to exported functions?
- [ ] Did I update `docs/traceability.md`?
- [ ] ESLint passes.
- [ ] All tests pass (`npm run test` + `npx playwright test`).
- [ ] **For UI changes:** verified in the browser — static analysis alone
      cannot catch timing-dependent or visual bugs.
- [ ] **For domain changes:** 100% test coverage on new/modified functions.

### Devil's Advocate Protocol

If a proposed change violates Clean Architecture (e.g., database queries in a
component, framework imports in `src/domain/`, client-side mutations bypassing
Server Actions), it must be **rejected** with:

1. An explanation of _why_ it is harmful.
2. A proposed **correct architectural alternative**.

### ADR Enforcement

Before implementing any change, verify it does **not** contradict an accepted
ADR in `docs/adr/`. If a new approach is needed, write a new ADR that supersedes
the old one before changing the code.

---

## 12. Next Steps

1. ~~Set up governance framework (architecture, design system, ADRs)~~ ✅
2. Initialize Next.js 16 project with tooling.
3. Create initial Supabase project (EU/Frankfurt).
4. Implement project overview page (analysis list).
5. Begin wizard implementation (Step 1: Start screen).
