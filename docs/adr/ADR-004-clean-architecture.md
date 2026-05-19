# ADR-004: Clean Architecture with Framework-Free Domain Layer

> **Status:** Accepted
> **Date:** 2026-05-18
> **Deciders:** Dennis Mende (Owner), AI Architect

## Context

PropScape contains complex financial calculation logic (cashflow analysis, ROI
computation, tax depreciation, stress testing). This logic will need to be
reused across:

1. The Next.js web application (Server Actions + client-side previews).
2. Future iOS and Android mobile applications.
3. Potential standalone API services.

Coupling this logic to React, Next.js, or any specific framework would make
reuse impossible without a full rewrite.

## Decision

Adopt **Clean Architecture** with a strict **framework-free domain layer**.

```
src/
├── domain/          ← ZERO framework imports. Pure TypeScript + Zod.
│   ├── calculations/   Financial computation functions
│   ├── schemas/         Zod validation schemas
│   ├── types/           Domain type definitions
│   └── rules/           Business rules & constants
├── actions/         ← Next.js Server Actions (thin orchestration layer)
├── app/             ← Next.js pages & layouts (UI layer)
├── components/      ← React components (UI layer)
├── hooks/           ← React hooks (UI layer)
├── stores/          ← Zustand stores (application layer)
└── lib/
    └── supabase/    ← Supabase client (infrastructure layer)
```

### Layer Rules

| Layer | Directory | May Import From | May NOT Import From |
|---|---|---|---|
| **Domain** | `src/domain/` | Only `zod`, standard lib | `react`, `next`, `@supabase/*`, `zustand` |
| **Application** | `src/stores/`, `src/actions/` | Domain, Infrastructure | `react` (stores may use framework-agnostic patterns) |
| **Infrastructure** | `src/lib/supabase/` | Domain (types/schemas) | UI components |
| **UI** | `src/app/`, `src/components/`, `src/hooks/` | All layers | — |

### Domain Function Signature Pattern

All domain functions follow a pure function pattern:

```typescript
/**
 * Calculates the monthly pre-tax cashflow.
 *
 * @remarks All monetary values are in integer cents to avoid
 * floating-point precision errors.
 */
export function calculatePreTaxCashflow(
  input: PreTaxCashflowInput
): Result<PreTaxCashflowOutput> {
  const parsed = preTaxCashflowInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }
  // ... pure calculation logic
  return { success: true, data: result };
}
```

## Rationale

- **Portability:** The domain layer can be copied into any TypeScript project
  (Node.js, Deno, Bun, React Native) without changes.
- **Testability:** Pure functions are trivially unit-testable. No mocking of
  React hooks, Next.js internals, or database connections.
- **Financial correctness:** Business logic is isolated and auditable.
  Calculation functions can be verified independently of UI concerns.
- **Future-proof:** When mobile apps are built, the domain layer is extracted
  as-is into a standalone package or API service.

## Alternatives Considered

| Alternative | Pros | Cons |
|---|---|---|
| All logic in Server Actions | Simpler architecture | Not reusable outside Next.js, hard to test |
| All logic in React hooks | Familiar pattern | Coupled to React, can't run server-side |
| Hexagonal Architecture | Very formal, port/adapter pattern | Over-engineered for current team size |

## Consequences

### Positive

- Domain logic is 100% portable and testable.
- Clear boundaries prevent accidental coupling.
- Financial calculations are auditable and verifiable.
- Mobile app development can start without rewriting business logic.

### Negative

- Slightly more boilerplate (data must flow through layers).
- Developers must understand the layer rules — not intuitive for those used
  to "just import what you need."

### Risks

- Layer violations if not enforced. Mitigated by:
  - Agent persona rules (Backend Agent in `.gemini/GEMINI.md`)
  - ESLint `no-restricted-imports` rule (future)
  - Code review discipline

## References

- Robert C. Martin, "Clean Architecture" (2017)
- [ADR-001: Next.js](ADR-001-nextjs-app-router.md) — framework choice
