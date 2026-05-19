# ADR-008: Centralised Configuration Layer (`src/config/`)

> **Status:** Accepted
> **Date:** 2026-05-19
> **Deciders:** Dennis Mende (Owner), AI Architect

## Context

During Step 3 and Step 4 implementation, two categories of data were
incorrectly embedded inside UI components:

1. **Regulatory / reference data** — e.g. `BUNDESLAND_TAX_RATES`,
   `BUNDESLAND_OPTIONS`. These are facts set by German law, not UI logic.
   They ended up duplicated in multiple components.

2. **User-overridable defaults** — e.g. broker fee 3.57%, notary fee 1.5%,
   default Bundesland "NW". These were scattered as magic numbers across
   `Step3Form`, `Step4Form`, and `Step4Shell`. The product roadmap includes a
   user Settings page that must override these values, which is impossible
   without a single source of truth.

Neither category belongs in the domain *calculations* layer (pure logic) or
the domain *types* layer (shape definitions), and neither belongs in UI
components.

## Decision

Introduce a dedicated **`src/config/`** layer as the single source of truth
for all data that:

- Changes independently of business logic (regulatory updates, market norms),
- Is shared across multiple layers (UI, domain calculations, server actions), or
- Will become user-configurable in a future Settings feature.

### Directory Structure

```
src/config/
├── bundesland.ts       — Grunderwerbsteuer rates + dropdown labels (regulatory)
└── wizard-defaults.ts  — Wizard form defaults (user-overridable in future)
```

### Layer Rules for `src/config/`

| Rule | Detail |
|---|---|
| **May import** | `domain/types/` only (for type references). No framework imports. |
| **May NOT import** | `react`, `next`, `components/`, `stores/`, `actions/`, `domain/calculations/` |
| **Who imports config** | `domain/calculations/`, `components/`, `stores/`, `actions/` |
| **Pure data only** | No functions with side effects. Only constants, interfaces, and pure resolver functions. |

### `WizardDefaults` Pattern (user-override readiness)

Every default value exposed via `src/config/` must be typed in a named
interface and consumed via `resolveWizardDefaults()`:

```typescript
// src/config/wizard-defaults.ts
export interface WizardDefaults { ... }
export const WIZARD_DEFAULTS: WizardDefaults = { ... } as const;
export function resolveWizardDefaults(user?: Partial<WizardDefaults>): WizardDefaults {
  return { ...WIZARD_DEFAULTS, ...user };
}
```

UI components and shells receive defaults via this resolver, **never by
reading `WIZARD_DEFAULTS` directly** in production paths (acceptable in tests).

### Placement Decision Table

When adding new data, use this table to decide where it lives:

| Data type | Example | Location |
|---|---|---|
| Regulatory / legal reference data | Tax rates, fee schedules | `src/config/` |
| User-overridable application defaults | Pre-filled form values | `src/config/` |
| Pure computation logic | `computeAncillaryCosts()` | `src/domain/calculations/` |
| Domain type shapes | `Step4Data`, `Bundesland` | `src/domain/types/` |
| Validation rules | `step4Schema` | `src/domain/schemas/` |
| UI-only display constants | Button labels, colour names | `src/components/` (co-located) |

### Enforcement

1. **ESLint `no-restricted-imports`** — `src/config/` files must not import
   from `react`, `next/*`, or any component/store path.
2. **Code review** — any magic number or object literal embedded in a
   component that represents market data or a default value is a violation.
3. **Agent standing rule** — recorded in `docs/context/state.md` §Standing
   Rules so it is read at every session start.

## Rationale

- **User settings feature** — `resolveWizardDefaults(userSettings)` is already
  wired. When the settings page ships, zero form changes are required.
- **Single update point** — when the government changes a Bundesland tax rate,
  one line changes in `config/bundesland.ts` and propagates everywhere.
- **Avoids domain layer pollution** — `domain/calculations/` should contain
  only computation logic, not lookup tables.
- **Testability** — config constants can be imported directly in tests without
  any mocking.

## Alternatives Considered

| Alternative | Pros | Cons |
|---|---|---|
| Keep data in `domain/calculations/` | One fewer directory | Mixes lookup tables with computation; domain becomes a dumping ground |
| Keep data in components | No extra files | Duplicated, impossible to override per-user, invisible to server-side code |
| Environment variables | Works for secrets | Wrong abstraction for structured typed data; no TypeScript types |

## Consequences

### Positive

- Single source of truth for all regulatory and default data.
- Per-user settings feature can be wired without touching any form component.
- Domain calculation layer stays pure (no lookup tables mixed with logic).
- Agent-readable: standing rule prevents regression in future sessions.

### Negative

- One more import path to remember (`@/config/...`).
- New team members need to learn the placement decision table.

### Risks

- Violations if placement decision table is not consulted. Mitigated by:
  - ESLint `no-restricted-imports` on config files (see §Enforcement).
  - Standing rule in `state.md`.
  - This ADR — agent checks `docs/adr/` before every implementation.

## References

- [ADR-004: Clean Architecture](ADR-004-clean-architecture.md)
- `src/config/bundesland.ts` — first implementation
- `src/config/wizard-defaults.ts` — first implementation
