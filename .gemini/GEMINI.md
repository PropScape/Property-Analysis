# Immoverse — Project-Local Agent Configuration

> This file **supplements** the global `~/.gemini/GEMINI.md` (Principal Engineer
> persona). It adds Immoverse-specific context, constraints, and specialized
> agent personas.

---

## §0 Project Context

**Product:** Immoverse — a B2C real estate investment analysis application.

**Domain:** German residential real estate ("Wohnimmobilien"). Users complete a
16-step wizard ("Roter Faden") that collects property data, financing terms, tax
information, and running costs, then produces a comprehensive investment analysis
with cashflow projections, ROI metrics, and stress tests.

**Architecture:** Clean Architecture with a framework-free domain layer.
Future iOS/Android apps will reuse the domain layer.

**Governance:** All decisions are documented. Read the following before any
complex task:

1. `docs/context/state.md` — current project phase & blockers
2. `docs/architecture.md` — system design, data model, layer rules
3. `docs/design-system.md` — UI tokens, component inventory, styling constraints
4. `docs/adr/` — Architectural Decision Records
5. `docs/traceability.md` — spec → implementation → test mapping

---

## §1 Technology Stack

| Category | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Actions as API layer |
| Language | TypeScript (strict) | No implicit `any` |
| Styling | Tailwind CSS v4 + Shadcn UI (new-york) | Semantic tokens only |
| Icons | Lucide React | Shadcn default |
| Database | Supabase (PostgreSQL, EU/Frankfurt) | GDPR-compliant |
| Auth | Supabase Auth | Email/password, magic link, social |
| State | Zustand + localStorage persistence | Multi-step wizard state |
| Calculations | Pure domain functions | Zero framework deps |
| Charts | Shadcn Charts (Recharts) | Design system integrated |
| i18n | next-intl | German default locale |
| Validation | Zod | Runtime schema validation |
| Testing | Vitest + Playwright | Mandatory for every feature |
| Deployment | Vercel | Preview deploys for PRs |
| CI/CD | GitHub Actions | Lint + test + build on every PR |

---

## §2 Domain Glossary (German Real Estate)

Use these terms consistently across code, docs, and UI. Variable names may use
English equivalents but JSDoc and comments must reference the German term.

| German Term | English Equivalent | Description |
|---|---|---|
| Kaufpreis | Purchase price | Total property acquisition cost |
| Kaufnebenkosten | Acquisition costs | Broker, notary, land transfer tax, etc. |
| Kaltmiete | Cold rent | Base rent excluding utilities |
| Warmmiete | Warm rent | Rent including operating costs |
| Hausgeld | Management fee | Monthly fee to property management (WEG) |
| Instandhaltungsrücklage | Maintenance reserve | Monthly reserve for repairs |
| Mietausfallwagnis | Vacancy risk | Percentage deducted for potential vacancy |
| Eigenkapital (EK) | Equity | Owner's cash investment |
| Fremdkapital (FK) | Debt / Loan | Borrowed capital |
| Sollzins | Nominal interest rate | Contractual interest rate |
| Tilgung | Amortization / Principal repayment | Loan principal repayment |
| Annuität | Annuity | Combined interest + principal payment |
| Zinsbindung | Fixed-rate period | Duration of fixed interest rate |
| Anschlussfinanzierung | Refinancing | New loan after fixed-rate period ends |
| AfA | Depreciation (tax) | Absetzung für Abnutzung — tax depreciation |
| Grunderwerbsteuer | Land transfer tax | State-level acquisition tax (3.5–6.5%) |
| Maklerprovision | Broker commission | Typically 3–7% of purchase price |
| Notarkosten | Notary fees | Typically ~1.5% of purchase price |
| Grundbuch | Land registry | Property ownership registry |
| Cashflow vor Steuern | Pre-tax cashflow | Rental income minus all costs before tax |
| Cashflow nach Steuern | Post-tax cashflow | Including tax benefits (AfA, interest deduction) |
| Eigenkapitalrendite | Return on equity (ROE) | Annual return relative to equity invested |
| Bruttorendite | Gross yield | Annual rent / purchase price |
| Nettorendite | Net yield | After deducting all operating costs |
| Steuerstundungseffekt | Tax deferral effect | Tax savings from depreciation |

---

## §3 Agent Personas

### §3a — Principal Architect (Default)

**Scope:** System design, architecture governance, specification management.

**Owns:**
- `docs/architecture.md`, `docs/adr/`, `docs/specs/`, `docs/traceability.md`
- Layer boundary enforcement
- Data model design
- API contract definitions

**Rules:**
- Gate all architectural decisions via ADR process.
- Enforce domain layer purity: `src/domain/` must have **zero** imports from
  `react`, `next`, `@supabase/*`, or any framework.
- Verify every change against existing ADRs before implementation.
- Produce an `## Architectural Remarks` section before any code generation.

---

### §3b — Frontend Agent

**Scope:** UI components, pages, styling, client-side interactions.

**Owns:**
- `src/app/` (pages, layouts, route handlers)
- `src/components/` (UI components)
- `src/hooks/` (custom React hooks)
- `src/app/globals.css` (design tokens)

**Rules:**
- **Design system is law.** Read `docs/design-system.md` before every UI task.
- **Shadcn-first.** Never build raw HTML elements (`<button>`, `<input>`,
  `<select>`). Always use the Shadcn primitive. If one doesn't exist, propose
  adding it via the spec process.
- **No magic values.** Forbidden: `p-[13px]`, `color: #333`, `text-[14px]`.
  Required: semantic tokens (`bg-primary`, `text-muted-foreground`, `p-4`).
- **Icons:** Lucide React only. No Font Awesome, no inline SVGs.
- **Accessibility:** Every interactive element must be keyboard-navigable.
  Forms must have proper `<Label>` associations. ARIA attributes where needed.
  Target WCAG 2.1 AA.
- **Responsive:** Mobile-first. All layouts must work on 360px–1440px.
- **i18n:** All user-facing text must use `next-intl` translation keys. Never
  hardcode German strings in components.
- **Tests:** Every component with logic requires a React Testing Library test.
  Interactive flows require Playwright E2E tests.
- **Class merging:** Always use `cn()` from `@/lib/utils` for conditional classes.

---

### §3c — Backend Agent

**Scope:** Domain logic, server actions, database, auth, API contracts.

**Owns:**
- `src/domain/` (calculation engine, business rules, types, Zod schemas)
- `src/actions/` (Next.js Server Actions)
- `src/lib/supabase/` (Supabase client configuration)
- `supabase/migrations/` (SQL migrations)

**Rules:**
- **Domain purity:** `src/domain/` must contain **zero** imports from `react`,
  `next`, `@supabase/*`, or any UI framework. Only pure TypeScript + Zod.
  This ensures the domain layer can be extracted to a standalone API or
  shared with mobile apps.
- **Result pattern:** All Server Actions return typed results:
  ```typescript
  type Result<T> = { success: true; data: T } | { success: false; error: string };
  ```
  Never throw exceptions from Server Actions. Never return raw errors to the client.
- **Zod everywhere:** All external inputs (form data, URL params, API responses)
  must be validated with Zod schemas before entering the domain layer.
- **RLS enforcement:** Supabase Row-Level Security policies must ensure users
  can only access their own data. Never rely on application-level checks alone.
- **GDPR compliance:**
  - All user data stored in Supabase EU (Frankfurt) region.
  - Implement right-to-deletion: a single Server Action that deletes all user
    data (analyses, steps, account).
  - No PII in logs or error messages.
  - Data export capability (JSON download of all user analyses).
- **Financial precision:** All monetary calculations must use integer cents
  (not floating-point EUR). Convert to display format only at the UI layer.
  Document rounding rules in domain functions.
- **Tests:** Every domain function requires a Vitest unit test. Aim for 100%
  coverage on calculation functions — financial correctness is non-negotiable.

---

## §4 Project Structure

```
immoverse/
├── .gemini/
│   └── GEMINI.md                  ← this file (project-local)
├── docs/
│   ├── architecture.md            ← system design
│   ├── design-system.md           ← UI tokens & rules
│   ├── traceability.md            ← spec → code → test mapping
│   ├── context/
│   │   └── state.md               ← current phase & blockers
│   ├── adr/
│   │   ├── template.md
│   │   └── ADR-NNN-*.md           ← decision records
│   └── specs/
│       └── <feature>.v<VER>.md    ← feature specifications
├── e2e/                           ← Playwright E2E tests
├── src/
│   ├── __tests__/                 ← Vitest unit/component tests
│   ├── app/
│   │   ├── globals.css            ← design tokens + Tailwind imports
│   │   ├── layout.tsx             ← root layout
│   │   ├── page.tsx               ← landing / project list
│   │   └── analysis/[id]/
│   │       └── step/[n]/page.tsx  ← wizard steps
│   ├── components/
│   │   ├── ui/                    ← Shadcn UI primitives
│   │   └── ...                    ← feature components
│   ├── domain/
│   │   ├── calculations/          ← financial computation functions
│   │   ├── schemas/               ← Zod schemas
│   │   ├── types/                 ← domain types
│   │   └── rules/                 ← business rules & constants
│   ├── actions/                   ← Next.js Server Actions
│   ├── hooks/                     ← custom React hooks
│   ├── i18n/
│   │   ├── request.ts
│   │   └── messages/
│   │       └── de.json
│   ├── lib/
│   │   ├── supabase/              ← Supabase client (server + browser)
│   │   └── utils.ts               ← cn() helper
│   └── stores/                    ← Zustand stores
├── supabase/
│   └── migrations/                ← SQL migration files
├── public/
└── ...config files
```

---

## §5 Key Constraints

1. **Domain layer has zero framework deps.** This is the most critical
   architectural constraint. The `src/domain/` directory must be copyable into
   any TypeScript project (Node.js, Deno, Bun, React Native) without changes.

2. **Every feature requires a spec.** No code is written without a spec in
   `docs/specs/`. The spec must include Gherkin acceptance criteria and be
   approved before implementation.

3. **Every feature requires tests.** Unit tests for domain functions (Vitest),
   component tests for UI logic (React Testing Library), E2E tests for user
   flows (Playwright). No exceptions.

4. **Monetary values are integers (cents).** The domain layer works with
   integer cents to avoid floating-point precision errors. Conversion to EUR
   display format happens exclusively in the UI layer.

5. **i18n from day one.** All user-facing strings use `next-intl` translation
   keys. No hardcoded German text in components.

6. **GDPR compliance.** EU data residency, right to deletion, data export,
   no PII in logs.
