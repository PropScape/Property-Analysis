# ADR-006: Testing Strategy — Vitest + Playwright, Mandatory for All Features

> **Status:** Accepted
> **Date:** 2026-05-18
> **Deciders:** Dennis Mende (Owner), AI Architect

## Context

Immoverse performs financial calculations that directly influence investment
decisions. Incorrect calculations (e.g., wrong tax depreciation, incorrect
cashflow) could lead users to make poor financial choices. Testing is not
optional — it is a business requirement.

Additionally, the SDD governance model requires every feature to have a spec
with Gherkin acceptance criteria. These criteria must be verifiable through
automated tests.

## Decision

Implement a **three-level testing strategy** with strict coverage requirements.
**No feature ships without tests.**

### Testing Levels

| Level | Tool | Scope | Coverage Target |
|---|---|---|---|
| **Unit** | Vitest | Domain functions, Zod schemas, utils | 100% on `src/domain/` |
| **Component** | React Testing Library + Vitest | UI components with logic | Critical interactions |
| **E2E** | Playwright | Full user flows (wizard, auth, save/load) | All Gherkin acceptance criteria |

### Unit Testing Rules (Domain)

Every function in `src/domain/calculations/` must have:

- **Happy path tests** with known-correct financial values.
- **Edge case tests** (zero values, maximum values, negative values).
- **Schema validation tests** (invalid input rejected by Zod).
- **Precision tests** (integer cents, no floating-point drift).

Example:

```typescript
describe('calculatePreTaxCashflow', () => {
  it('returns positive cashflow when rent exceeds costs', () => {
    const result = calculatePreTaxCashflow({
      monthlyRentCents: 140000, // 1.400,00 €
      monthlyManagementFeeCents: 15000,
      monthlyMaintenanceReserveCents: 8000,
      vacancyRatePercent: 2,
      monthlyLoanPaymentCents: 91800,
    });

    expect(result.success).toBe(true);
    expect(result.data.monthlyCashflowCents).toBe(22400); // 224,00 €
  });

  it('rejects negative rent values', () => {
    const result = calculatePreTaxCashflow({
      monthlyRentCents: -100,
      // ...
    });

    expect(result.success).toBe(false);
  });
});
```

### E2E Testing Rules

Every spec's Gherkin acceptance criteria must map to at least one Playwright
test. The test must:

1. Simulate real user interaction (click, type, navigate).
2. Verify visible outcomes (displayed values, navigation state).
3. Run in CI on every PR.

### CI Integration

GitHub Actions runs on every PR:

```yaml
- npm run lint
- npm run test          # Vitest (unit + component)
- npx playwright test   # E2E
- npm run build         # TypeScript compilation
```

All four must pass before a PR can be merged.

## Rationale

- **Financial correctness is non-negotiable.** A calculation bug could cost
  users real money. 100% domain test coverage is the minimum.
- **Gherkin ↔ E2E traceability.** Every acceptance criterion has a
  corresponding test, creating an audit trail from requirement to verification.
- **Vitest** is fast (native ESM, Vite-based), compatible with the Next.js
  ecosystem, and supports React Testing Library.
- **Playwright** provides reliable cross-browser E2E testing with auto-waiting,
  excellent debugging tools, and CI-friendly configuration.

## Alternatives Considered

| Alternative | Pros | Cons |
|---|---|---|
| Jest | Most popular, mature | Slower than Vitest, CJS-first, config-heavy |
| Cypress | Great DX, time-travel debugging | Heavier, slower CI, no true multi-tab support |
| Testing Library only | Lighter setup | No true E2E coverage (browser interactions) |

## Consequences

### Positive

- High confidence in financial calculation correctness.
- Regression protection on every PR.
- Gherkin acceptance criteria are mechanically verified.
- Refactoring is safe — tests catch regressions immediately.

### Negative

- Higher upfront development cost (writing tests alongside features).
- CI pipeline takes longer to run. Mitigated by running unit tests and E2E
  tests in parallel.

### Risks

- Test maintenance burden as the application grows. Mitigated by keeping tests
  focused and avoiding over-mocking.
- Flaky E2E tests. Mitigated by using Playwright's auto-waiting and avoiding
  arbitrary timeouts.

## References

- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
