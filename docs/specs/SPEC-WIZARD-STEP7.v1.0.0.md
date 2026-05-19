---
id: SPEC-WIZARD-STEP7
version: 1.0.0
status: archived
created: 2026-05-19
author: AI Architect
---

# SPEC-WIZARD-STEP7 v1.0.0 — Hausgeld & Verwaltung

## 1. Overview

Implements step 7 of the 16-step property analysis wizard.

The user defines their monthly operating costs and annual one-off costs. The form captures:
- **Umlagefähig (Recoverable)** in integer cents / month.
- **Nicht umlagefähig (Non-Recoverable)** in integer cents / month.
- **Sondereigentumsverwaltung (Property Management)** in integer cents / month.
- **Instandhaltungsrücklage (Maintenance Reserve)** in integer cents / month.
- **Zusatz-Versicherungen (Additional Insurance)** in integer cents / year.
- **Sonstige Nebenkosten (Other Costs)** in integer cents / year.

The **Live Operating Costs Dashboard** shows:
- **Eigentümer-Kosten (mtl.)**: Non-recoverable + Management + Maintenance.
- **Kostenquote (Kaltmiete)**: (Annual Owner Costs) / (Annual Cold Rent). 
  - Visualized via a gauge bar (Gut < 20%, Hoch > 35%).
- **Annual Summary**: Total Running Costs (p.a.) and Total One-off Costs (p.a.).

**Key architectural constraints:**
- Costs stored as integer cents (ADR-004).
- Default values are configured as 0 (no magic absolute values without property size context).
- Requires `monthlyColdRentCents` from Step 3 for the cost ratio calculation.

---

## 2. Routes

| Route | Type | Description |
|---|---|---|
| `/analysis/[id]/step/7` | Server Component → Client Shell | Step 7 page |

---

## 3. Domain Types (`src/domain/types/wizard.ts`)

### `Step7Data`

| Field | Type | Notes |
|---|---|---|
| `recoverable_costs_per_month_cents` | `number` (int) | ≥ 0. Umlagefähig. |
| `non_recoverable_costs_per_month_cents` | `number` (int) | ≥ 0. Nicht umlagefähig. |
| `property_management_fee_per_month_cents` | `number` (int) | ≥ 0. SEV. |
| `maintenance_reserve_per_month_cents` | `number` (int) | ≥ 0. Instandhaltung. |
| `additional_insurance_per_year_cents` | `number` (int) | ≥ 0. Zusatz-Versicherung. |
| `other_costs_per_year_cents` | `number` (int) | ≥ 0. Sonstige. |

---

## 4. Schema (`src/domain/schemas/step7.ts`)

Validated with Zod v4:
- All fields: int ≥ 0

---

## 5. Domain Calculation (`src/domain/calculations/operating-costs.ts`)

### `OperatingCostsBreakdown` interface

| Field | Type | Notes |
|---|---|---|
| `ownerCostsPerMonthCents` | `number` | `non_recoverable` + `management` + `maintenance` |
| `annualRunningCostsCents` | `number` | `ownerCostsPerMonthCents` * 12 |
| `annualOneOffCostsCents` | `number` | `insurance` + `other` |
| `totalAnnualCostsCents` | `number` | `annualRunningCostsCents` + `annualOneOffCostsCents` |
| `costRatioPercent` | `number` | `(totalAnnualCostsCents / (monthlyColdRentCents * 12)) * 100` |

### `computeOperatingCostsBreakdown(...)`

Pure function. If `monthlyColdRentCents` is 0, `costRatioPercent` is 0.

---

## 6. Config Defaults (`src/config/wizard-defaults.ts`)

Add to `WizardDefaults`:
- `defaultRecoverableCostsPerMonthCents`: 0
- `defaultNonRecoverableCostsPerMonthCents`: 0
- `defaultPropertyManagementFeePerMonthCents`: 0
- `defaultMaintenanceReservePerMonthCents`: 0
- `defaultAdditionalInsurancePerYearCents`: 0
- `defaultOtherCostsPerYearCents`: 0

---

## 7. Acceptance Criteria (Gherkin)

### AC-1: Empty state / Default pre-fill
```gherkin
GIVEN an authenticated user on step 7 with no saved data
WHEN the page loads
THEN all cost fields are defaulted to 0 €
AND the Kostenquote is 0%
```

### AC-2: Live sidebar updates
```gherkin
GIVEN a Monthly Cold Rent of 1.000 € (12.000 € p.a.)
WHEN the user enters 130 € Non-recoverable, 25 € Management, 50 € Maintenance
THEN the "Eigentümer-Kosten (mtl.)" instantly shows 205 €
AND the "Laufende Kosten (p.a.)" instantly shows 2.460 €
AND the Kostenquote shows ~20.5%
```

### AC-3: One-off costs impact
```gherkin
GIVEN the conditions from AC-2
WHEN the user enters 120 € for Additional Insurance
THEN the "Einmalige Kosten (p.a.)" shows 120 €
AND the "Gesamtkosten (p.a.)" shows 2.580 €
AND the Kostenquote shows 21.5%
```

### AC-4: Persistence on submit
```gherkin
GIVEN a user fills in valid data and clicks "Weiter zu Initial Cashflow"
THEN data is validated server-side via step7Schema
AND saved to analysis_steps (step_number = 7)
AND the user is navigated to step 8
```

---

## 8. Implementation Plan

| Concern | File |
|---|---|
| Domain types | `src/domain/types/wizard.ts` → `Step7Data` |
| Zod schema | `src/domain/schemas/step7.ts` |
| Domain calc | `src/domain/calculations/operating-costs.ts` |
| Config defaults| `src/config/wizard-defaults.ts` |
| Zustand slice | `src/stores/analysis-store.ts` |
| Server action | `src/actions/analysis.ts` |
| Component | `src/components/wizard/steps/Step7Form.tsx` |
| Client shell | `src/components/wizard/steps/Step7Shell.tsx` |
| Page route | `src/app/analysis/[id]/step/[step]/page.tsx` |
| Tests | `src/__tests__/step7.schema.test.ts`, `src/__tests__/operating-costs.test.ts` |
