---
id: SPEC-WIZARD-STEP8
version: 1.0.0
status: archived
created: 2026-05-19
author: AI Architect
---

# SPEC-WIZARD-STEP8 v1.0.0 — Initial Cashflow

## 1. Overview

Implements step 8 of the 16-step property analysis wizard.
This is a pure dashboard step. It aggregates data from steps 3, 4, 5, 6, and 7 to calculate the "Initial Monthly Cashflow" (Cashflow vor Steuern).

It visualizes the composition of the cashflow:
- **Kaltmiete** (positive income)
- **Eigentümer-Kosten** (negative expense)
- **Kapitaldienst** (negative expense)

It introduces a navigation fix to the global `WizardStepper`: clicking a step number will now work for any step $\le$ the furthest step reached by the user in the database, allowing free back-and-forth traversal of completed steps.

---

## 2. Routes

| Route | Type | Description |
|---|---|---|
| `/analysis/[id]/step/8` | Server Component → Client Shell | Step 8 page |

---

## 3. Domain Types (`src/domain/types/wizard.ts`)

### `Step8Data`
An empty interface, as Step 8 requires no inputs, but must be saved to mark it as complete.

| Field | Type | Notes |
|---|---|---|
| - | - | Empty object `{}` |

---

## 4. Schema (`src/domain/schemas/step8.ts`)

Validated with Zod v4:
- `step8Schema` allows an empty object.

---

## 5. Domain Calculation (`src/domain/calculations/cashflow.ts`)

### `computeInitialCashflow(...)`
Pure function returning the sum of cash inflows and outflows.

| Input | Notes |
|---|---|
| `monthlyColdRentCents` | From Step 3 |
| `ownerCostsPerMonthCents` | Computed from Step 7 `computeOperatingCostsBreakdown` |
| `monthlyPaymentCents` | Computed from Step 6 `computeFinancingBreakdown` |

| Output | Notes |
|---|---|
| `monthlyCashflowCents` | `Cold Rent - Owner Costs - Debt Service` |
| `isPositive` | `monthlyCashflowCents > 0` |

---

## 6. Stepper Navigation Improvements

The `WizardStepper` is refactored to accept a `furthestStep` prop (derived from `analysis.current_step` in `layout.tsx`).
Any `step <= furthestStep` is marked as completed and is clickable, unblocking the user to navigate forward to previously completed steps.

---

## 7. Acceptance Criteria (Gherkin)

### AC-1: Dashboard Calculation
```gherkin
GIVEN a monthly cold rent of 1250 € (Step 3)
AND monthly owner costs of 215 € (Step 7)
AND monthly debt service of 690 € (Step 6)
WHEN the user navigates to Step 8
THEN the "Cashflow vor Steuern" shows "+ 345 €"
AND the breakdown table lists the three components accurately
```

### AC-2: Edit Assumptions Navigation
```gherkin
GIVEN the user is on Step 8
WHEN they click the pencil icon next to "Kaltmiete"
THEN they are navigated to `/analysis/[id]/step/3`
```

### AC-3: Stepper Unlocked Forward Navigation
```gherkin
GIVEN the user has reached Step 9 (current_step = 9 in DB)
WHEN the user manually navigates back to Step 2
THEN the `WizardStepper` shows steps 1 through 9 as completed (unlocked)
AND clicking on Step 8 in the stepper navigates directly to Step 8
```

---

## 8. Implementation Plan

| Concern | File |
|---|---|
| Domain types | `src/domain/types/wizard.ts` → `Step8Data` |
| Zod schema | `src/domain/schemas/step8.ts` |
| Domain calc | `src/domain/calculations/cashflow.ts` |
| Zustand slice | `src/stores/analysis-store.ts` |
| Server action | `src/actions/analysis.ts` |
| Component | `src/components/wizard/steps/Step8Shell.tsx` |
| Page route | `src/app/analysis/[id]/step/[step]/page.tsx` |
| Stepper | `src/components/wizard/WizardStepper.tsx`, `layout.tsx` |
| Tests | `src/__tests__/cashflow.test.ts` |
