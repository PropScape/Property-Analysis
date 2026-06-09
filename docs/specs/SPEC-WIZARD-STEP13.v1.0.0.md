---
id: SPEC-WIZARD-STEP13
version: 1.0.0
status: archived
created: 2026-06-09
author: AI Architect
mockup: "Ideation/Initial Design Idea/15-Real Estate - Final Cashflow.html"
---

# SPEC-WIZARD-STEP13 v1.0.0 — Final Cashflow & KPIs

## 1. Overview

Implements Step 13 of the 16-step wizard: **Results Summary — Final Cashflow & KPIs**.

This step is a **read-only aggregation screen** ("shell"). It does not collect any
new user input. Instead, it reads persisted data from every prior step via
Supabase and presents a synthesized financial result across three tabs:

1. **Cashflow & Steuern** — monthly and annual cashflow before and after tax,
   a 10-year cashflow projection chart (Recharts), and a tax-effect callout.
2. **Eigenkapital & Rendite** — Eigenkapitalbedarf, Bruttorendite, ROE (Year 1),
   plus a Vermögensaufbau breakdown (Tilgung + Wertsteigerung + Total Return).
3. **Stresstest Highlights** — three pre-computed adverse scenarios:
   - Vacancy spike (2% → 10%)
   - Interest rate rise (refinancing risk, +2 pp)
   - Unexpected maintenance (one-off €5 000)

The right column contains a dark "Expert Dashboard Teaser" card linking to Step 14.

This step follows the **Shell pattern** (no form, no user input, no validation schema,
no Zod schema, no dedicated Zustand slice). All KPIs are **computed on demand** from
step data fetched server-side and passed as props.

---

## 2. Data Sources

Step 13 aggregates data from:

| Source Step | Fields Used |
|---|---|
| Step 3 | `purchase_price_cents`, `cold_rent_cents`, `warm_rent_cents`, `vacancy_rate_percent` |
| Step 4 | `total_investment_cents` (= purchase price + Nebenkosten) |
| Step 6 | `equity_cents`, `loan_amount_cents`, `interest_rate_percent`, `repayment_rate_percent` |
| Step 7 | `monthly_owner_costs_cents` |
| Step 10 | `effective_tax_rate_percent` (computed from stored fields) |
| Step 11 | `annual_depreciation_cents` (AfA + land-share logic) |
| Step 12 | `non_recoverable_costs_per_month_cents`, `special_deductions_total_cents` |

All data is fetched server-side via `fetchSavedStepData()` in `page.tsx` and
passed as a typed `Step13Props` to the shell component. **No Zustand slice needed.**

---

## 3. Domain Entities

### `Step13Data`

Step 13 stores no user-entered fields. It is a marker type used only for
`saveStepAction` to advance `current_step` in the DB when the user clicks
"Weiter" (which navigates to Step 14).

```ts
export type Step13Data = Record<string, never>;
```

### `FinalCashflowSummary`

A pure computed value object returned by the domain calculation function.
Never persisted.

| Field | Type | Description |
|---|---|---|
| `preTaxMonthCents` | `number` | Net cashflow before taxes per month (integer cents) |
| `preTaxAnnualCents` | `number` | `preTaxMonthCents × 12` |
| `taxRefundAnnualCents` | `number` | Tax benefit from AfA + interest deduction |
| `afterTaxMonthCents` | `number` | `preTaxMonthCents + taxRefundAnnualCents / 12` |
| `afterTaxAnnualCents` | `number` | `afterTaxMonthCents × 12` |
| `equityRequiredCents` | `number` | Equity + Nebenkosten paid at close |
| `grossYieldPercent` | `number` | `(coldRent × 12) / purchasePrice × 100` |
| `roePercent` | `number` | `afterTaxAnnualCents / equityRequiredCents × 100` |
| `annualRepaymentCents` | `number` | Tilgung p.a. (loan × repaymentRate%) |
| `appreciationAnnualCents` | `number` | `purchasePrice × 2%` (configurable growth assumption) |
| `totalReturnYear1Cents` | `number` | `afterTaxAnnualCents + annualRepaymentCents + appreciationAnnualCents` |
| `projectionYears` | `ProjectionYear[]` | 10-year cashflow projection array |
| `investmentStatus` | `"positiv" \| "neutral" \| "negativ"` | Badge classification |

### `ProjectionYear`

| Field | Type | Description |
|---|---|---|
| `year` | `number` | 1–10 |
| `preTaxCents` | `number` | Annual cashflow before tax (grows with rent growth assumption) |
| `afterTaxCents` | `number` | Annual cashflow after tax (AfA benefit declines over time) |

### `StressScenario`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Stable key |
| `title` | `string` | German scenario name |
| `description` | `string` | Parameter change description |
| `cashflowMonthCents` | `number` | Resulting monthly cashflow |
| `deltaCents` | `number` | Change vs baseline |
| `status` | `"ok" \| "risk" \| "critical"` | Traffic-light rating |

---

## 4. Domain Calculations — `final-cashflow.ts`

New file: `src/domain/calculations/final-cashflow.ts`

### 4.1 `computeFinalCashflow(inputs: FinalCashflowInputs): FinalCashflowSummary`

**Inputs:**
```ts
interface FinalCashflowInputs {
  purchasePriceCents: number;
  totalInvestmentCents: number;
  coldRentCents: number;
  equityCents: number;
  loanAmountCents: number;
  interestRatePercent: number;
  repaymentRatePercent: number;
  monthlyOwnerCostsCents: number;
  effectiveTaxRatePercent: number;
  annualDepreciationCents: number;
  nonRecoverableCostsPerMonthCents: number;
  specialDeductionsTotalCents: number;
  appreciationRatePercent?: number; // default 2.0 (from config)
}
```

**Algorithm:**
1. `monthlyDebtService = annuityPayment(loan, interest, repayment)` (reuse from Step 6)
2. `preTaxMonthCents = coldRentCents - monthlyOwnerCostsCents - nonRecoverableCostsPerMonthCents - monthlyDebtService`
3. `taxableIncome = coldRentCents × 12 - annualDepreciationCents - (loanAmount × interestRatePercent / 100) - specialDeductionsTotalCents`
4. `taxRefundAnnualCents = max(0, -taxableIncome) × (effectiveTaxRatePercent / 100)` (negative taxable income = refund)
5. `afterTaxMonthCents = preTaxMonthCents + round(taxRefundAnnualCents / 12)`
6. `grossYieldPercent = (coldRentCents × 12) / purchasePriceCents × 100`
7. `roePercent = (afterTaxAnnualCents / equityCents) × 100`
8. `annualRepaymentCents = round(loanAmountCents × repaymentRatePercent / 100)`
9. `appreciationAnnualCents = round(purchasePriceCents × (appreciationRatePercent / 100))`
10. `totalReturnYear1Cents = afterTaxAnnualCents + annualRepaymentCents + appreciationAnnualCents`
11. `investmentStatus`: "positiv" if afterTaxMonthCents > 0, "neutral" if ≥ -50 €, else "negativ"
12. `projectionYears`: project 10 years, coldRent grows 1% p.a., AfA benefit constant, interest deduction declines as loan amortises

### 4.2 `computeStressScenarios(baseline, inputs): StressScenario[]`

Three fixed scenarios applied to the baseline cashflow:
1. **Mietausfallwagnis** — vacancy increases from baseline to 10%
2. **Zinsänderungsrisiko** — interest rate rises by +2 percentage points
3. **Instandhaltung** — one-off €5 000 cost in year 1 (divided by 12 = monthly impact)

Status thresholds:
- `afterTaxMonthCents > 0` → `"ok"`
- `afterTaxMonthCents >= -100` → `"risk"`
- `afterTaxMonthCents < -100` → `"critical"`

---

## 5. Configuration

New constant in `wizard-defaults.ts`:

```ts
defaultAppreciationRatePercent: number; // 2.0
defaultStressVacancyPercent: number;    // 10.0
defaultStressInterestDeltaPp: number;   // 2.0
defaultStressMaintenanceOnceCents: number; // 500000 (= 5000 €)
```

---

## 6. Component — `Step13Shell.tsx`

Pattern: **Shell** (no form, no submit — same as Step 8 and Step 9).

**Props:**
```ts
interface Step13ShellProps {
  analysisId: string;
  summary: FinalCashflowSummary;
  scenarios: StressScenario[];
}
```

**Layout:**
- Left column (`lg:w-8/12`): tab panel with three tabs (Cashflow & Steuern,
  Eigenkapital & Rendite, Stresstest Highlights)
- Right column (`lg:w-4/12`): dark "Expert Dashboard Teaser" card

**Tab implementation:** React `useState` (no URL hash) — three content panels,
one active at a time, with CSS `opacity`/`display` transition.

**Chart:** Recharts `ResponsiveContainer → ComposedChart` (line + area) for the
10-year cashflow projection. Uses the `recharts` package (already in deps).

**Status badge:** Dynamic — colour and text driven by `summary.investmentStatus`:
- `"positiv"` → `bg-emerald-50 border-emerald-200 text-emerald-700`
- `"neutral"` → `bg-amber-50 border-amber-200 text-amber-700`
- `"negativ"` → `bg-red-50 border-red-200 text-red-700`

**Navigation:** "Weiter" → calls `saveStepAction({ stepNumber: 13, data: {} })`,
then `router.push('/analysis/[id]/step/14')`. No validation schema needed
(empty object always valid).

---

## 7. Acceptance Criteria

```gherkin
Feature: Step 13 — Final Cashflow & KPIs

  Scenario: AC-1 — KPI calculations are correct
    GIVEN a user who has completed steps 3, 6, 7, 10, 11, 12
    WHEN the domain function computeFinalCashflow receives their saved data
    THEN preTaxMonthCents = coldRent - ownerCosts - nonRecoverable - monthlyDebtService
    AND  taxRefundAnnualCents ≥ 0 (clamped at zero if taxable income is positive)
    AND  afterTaxMonthCents = preTaxMonthCents + round(taxRefund / 12)

  Scenario: AC-2 — Investment status badge
    GIVEN afterTaxMonthCents > 0
    WHEN the shell renders
    THEN the badge reads "Investment Positiv" with emerald styling
    GIVEN afterTaxMonthCents < -100
    WHEN the shell renders
    THEN the badge reads "Investment Negativ" with red styling

  Scenario: AC-3 — Stress scenarios
    GIVEN the baseline cashflow of X € / month
    WHEN vacancy rises to 10%
    THEN scenario cashflow = baseline - (coldRent × (0.10 - vacancyRate))
    AND  status is "ok" if cashflow > 0, "risk" if ≥ -100, "critical" otherwise

  Scenario: AC-4 — 10-year projection
    GIVEN year 1 coldRent and a 1% annual growth assumption
    WHEN projectionYears is computed
    THEN each subsequent year's preTaxCents grows by 1% of the previous year's coldRent
    AND the array has exactly 10 entries

  Scenario: AC-5 — Tab switching
    GIVEN the shell is mounted on "Cashflow & Steuern"
    WHEN the user clicks "Eigenkapital & Rendite"
    THEN the equity panel is visible and the cashflow panel is hidden

  Scenario: AC-6 — "Weiter" navigation
    GIVEN the user clicks "Weiter zur Gesamtübersicht"
    WHEN saveStepAction({ stepNumber: 13, data: {} }) resolves successfully
    THEN the user is navigated to /analysis/[id]/step/14
    AND the WizardStepper shows step 13 as completed
```

---

## 8. Files Created / Modified

| File | Action |
|---|---|
| `src/domain/types/wizard.ts` | ADD `Step13Data`, `FinalCashflowSummary`, `ProjectionYear`, `StressScenario`, `FinalCashflowInputs` |
| `src/domain/calculations/final-cashflow.ts` | NEW — `computeFinalCashflow`, `computeStressScenarios` |
| `src/domain/calculations/index.ts` | MODIFY — barrel export |
| `src/domain/schemas/step13.ts` | NEW — trivial schema (`z.object({})`) |
| `src/config/wizard-defaults.ts` | MODIFY — add Step 13 constants |
| `src/actions/analysis.ts` | MODIFY — add step 13 validation branch |
| `src/components/wizard/steps/Step13Shell.tsx` | NEW — shell UI component |
| `src/app/analysis/[id]/step/[step]/page.tsx` | MODIFY — add step 13 case |
| `src/__tests__/final-cashflow.test.ts` | NEW — domain calculation tests |

---

## 9. Architectural Remarks

1. **Scalability risk:** The 10-year projection iterates a simple linear model.
   If future specs require a DCF model with variable growth rates, the
   `ProjectionYear` interface should be extended — not replaced.
2. **Security risk:** All inputs come from server-fetched Supabase data, not
   from client-side state. There is no user-controlled number that feeds the
   calculation without DB-round-trip validation.
3. **ADR compliance:** No ADR contradicts a read-only results screen at step 13.
   The shell pattern is consistent with Steps 8 and 9. ADR-004 is respected —
   `final-cashflow.ts` has zero framework imports.
