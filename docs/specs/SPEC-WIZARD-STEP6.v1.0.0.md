---
id: SPEC-WIZARD-STEP6
version: 1.0.0
status: archived
created: 2026-05-19
author: AI Architect
---

# SPEC-WIZARD-STEP6 v1.0.0 — Finanzierung

## 1. Overview

Implements step 6 of the 16-step property analysis wizard.

The user defines the financing structure for the property purchase and renovations.
The form captures:
- **Equity (Eigenkapital)** in integer cents.
- **Main Loan Interest Rate (Sollzins)** in percent.
- **Main Loan Initial Repayment (Anfängliche Tilgung)** in percent.
- **Main Loan Fixation Period (Zinsbindung)** in years.
- **Processing Fee (Bearbeitungsgebühr)** (optional) in integer cents.

The **Loan Amount (Darlehenssumme)** is automatically calculated as:
`Total Investment - Equity`

A **Live Financial Health Sidebar** shows:
- **Monthly Debt Service (Kapitaldienst)**: The monthly annuity payment.
- **Repayment Schedule Hint**: Estimated years until the loan is fully paid off (assuming conditions remain identical).

*Note: The "Zweite Tranche" and "DSCR" features were explicitly descoped for MVP based on user feedback.*

**Key architectural constraints:**
- Costs stored as integer cents (ADR-004).
- Formula calculations live in `src/domain/calculations/financing.ts`.
- Defaults (interest, repayment, fixation) live in `src/config/wizard-defaults.ts`.
- The LTV (Loan-to-Value) slider bidirectionally updates the equity input.

---

## 2. Routes

| Route | Type | Description |
|---|---|---|
| `/analysis/[id]/step/6` | Server Component → Client Shell | Step 6 page |

---

## 3. Domain Types (`src/domain/types/wizard.ts`)

### `Step6Data`

| Field | Type | Notes |
|---|---|---|
| `equity_cents` | `number` (int) | ≥ 0. User's own capital. |
| `loan_interest_rate_percent` | `number` | 0–20. Interest rate p.a. |
| `loan_repayment_rate_percent` | `number` | 0–20. Initial repayment rate p.a. |
| `loan_fixation_years` | `number` | [5, 10, 15, 20]. Fixed interest period. |
| `loan_processing_fee_cents` | `number` (int) | ≥ 0. Optional one-off fee. |

---

## 4. Schema (`src/domain/schemas/step6.ts`)

Validated with Zod v4:
- `equity_cents`: int ≥ 0
- `loan_interest_rate_percent`: float, 0–20
- `loan_repayment_rate_percent`: float, 0–20
- `loan_fixation_years`: number, one of [5, 10, 15, 20]
- `loan_processing_fee_cents`: int ≥ 0

---

## 5. Domain Calculation (`src/domain/calculations/financing.ts`)

### `FinancingBreakdown` interface

| Field | Type | Notes |
|---|---|---|
| `loanAmountCents` | `number` | `totalInvestmentCents - equity_cents` (min 0) |
| `ltvPercent` | `number` | `(loanAmountCents / totalInvestmentCents) * 100` |
| `monthlyPaymentCents` | `number` | `(loanAmountCents * (interest + repayment) / 100) / 12` |
| `yearsToPayoff` | `number` | Estimated full repayment duration. |

### `computeFinancingBreakdown(...)`

Pure function, no side effects, no UI imports.

---

## 6. Config Defaults (`src/config/wizard-defaults.ts`)

Add to `WizardDefaults`:
| Key | Value | Rationale |
|---|---|---|
| `mainLoanInterestPercent` | `3.8` | Current market average |
| `mainLoanRepaymentPercent` | `2.0` | Standard annuity repayment rate |
| `mainLoanFixationYears` | `10` | Standard fixation period |

---

## 7. Acceptance Criteria (Gherkin)

### AC-1: Empty state / Default pre-fill
```gherkin
GIVEN an authenticated user on step 6 with no saved data
WHEN the page loads
THEN Equity is defaulted to 0 € (or derived from a default LTV if we want)
AND Interest Rate defaults to 3.8%
AND Repayment Rate defaults to 2.0%
AND Fixation Period defaults to 10 Jahre
AND Processing Fee defaults to 0 €
```

### AC-2: Auto-calculate Loan Amount
```gherkin
GIVEN a Total Investment of 400.000 €
WHEN the user enters 100.000 € as Equity
THEN the Loan Amount field (readonly) instantly shows 300.000 €
AND the LTV slider updates to 75%
```

### AC-3: LTV Slider bidirectional binding
```gherkin
GIVEN a Total Investment of 400.000 €
WHEN the user drags the LTV slider to 90%
THEN the Equity input updates to 40.000 €
AND the Loan Amount updates to 360.000 €
```

### AC-4: Monthly Payment calculation
```gherkin
GIVEN a Loan Amount of 360.000 €
AND Interest Rate of 3.8%
AND Repayment Rate of 2.0%
THEN the Financial Health Sidebar shows a Monthly Payment of 1.740,00 €
  (360.000 * 5.8% / 12)
```

### AC-5: Live sidebar updates
```gherkin
GIVEN the user changes the Interest Rate to 4.0%
THEN the Monthly Payment instantly updates to 1.800,00 €
  (360.000 * 6.0% / 12)
```

### AC-6: Persistence on submit
```gherkin
GIVEN a user fills in valid data and clicks "Weiter zu Hausgeld"
THEN data is validated server-side via step6Schema
AND saved to analysis_steps (step_number = 6)
AND the user is navigated to step 7
```

### AC-7: DB hydration on reload
```gherkin
GIVEN a user previously saved step 6 data
WHEN they reload /analysis/[id]/step/6
THEN all fields populate with the saved DB values
AND the sidebar shows the correct calculations
```

---

## 8. Implementation Plan

| Concern | File |
|---|---|
| Domain types | `src/domain/types/wizard.ts` → `Step6Data` |
| Zod schema | `src/domain/schemas/step6.ts` |
| Domain calc | `src/domain/calculations/financing.ts` |
| Config defaults| `src/config/wizard-defaults.ts` |
| Zustand slice | `src/stores/analysis-store.ts` |
| Server action | `src/actions/analysis.ts` |
| Component | `src/components/wizard/steps/Step6Form.tsx` |
| Client shell | `src/components/wizard/steps/Step6Shell.tsx` |
| Page route | `src/app/analysis/[id]/step/[step]/page.tsx` |
| Tests | `src/__tests__/step6.schema.test.ts`, `src/__tests__/financing.test.ts` |
