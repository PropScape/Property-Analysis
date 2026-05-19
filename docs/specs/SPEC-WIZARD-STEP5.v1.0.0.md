---
id: SPEC-WIZARD-STEP5
version: 1.0.0
status: archived
created: 2026-05-19
author: AI Architect
---

# SPEC-WIZARD-STEP5 v1.0.0 — Sanierungsmaßnahmen

## 1. Overview

Implements step 5 of the 16-step property analysis wizard.

The user enters all planned **renovation and maintenance measures**
(Sanierungsmaßnahmen). Each measure has:
- A free-text label (Bezeichnung)
- A cost in EUR, stored as **integer cents** per the monetary precision rule
- A timing flag: **sofort** (immediate) vs. **über Jahre** (deferred)
- An optional **fremdfinanziert** flag (externally financed)

If at least one measure is marked `fremdfinanziert`, a **financing details
panel** is displayed with interest rate and repayment rate fields.

A **right sidebar Impact Preview card** shows:
- Previous total investment (from steps 3 + 4)
- Sofortmaßnahmen subtotal
- Spätere Maßnahmen subtotal
- New Gesamtinvestition
- Static tax-relevance info panel

**Key architectural constraints:**
- Costs stored as integer cents (ADR-004 standing rule).
- Defaults for interest and repayment rates live in `src/config/wizard-defaults.ts`.
- All calculation logic (totals, sofort/later split) lives in
  `src/domain/calculations/renovation.ts` — not in the component.
- Pattern: `Step5Shell` (client, owns shared live state) →
  `Step5Form` (inputs) + `Step5ImpactPreviewCard` (sidebar).

---

## 2. Routes

| Route | Type | Description |
|---|---|---|
| `/analysis/[id]/step/5` | Server Component → Client Shell | Step 5 page |

---

## 3. Domain Types (`src/domain/types/wizard.ts`)

### `RenovationMeasure`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Client-side UUID for React key / array identity |
| `label` | `string` | 1–100 chars |
| `cost_cents` | `number` (int) | ≥ 0 |
| `is_immediate` | `boolean` | true = sofort, false = über Jahre |
| `is_financed` | `boolean` | true = fremdfinanziert |

### `Step5Data`

| Field | Type | Notes |
|---|---|---|
| `measures` | `RenovationMeasure[]` | 0–20 items |
| `financing_interest_rate_percent` | `number` | 0–20. Only used if any measure `is_financed`. |
| `financing_repayment_rate_percent` | `number` | 0–20. Only used if any measure `is_financed`. |

---

## 4. Schema (`src/domain/schemas/step5.ts`)

Validated with Zod v4:

- `measures`: array (max 20) of:
  - `id`: string (min 1)
  - `label`: string, 1–100 chars
  - `cost_cents`: int ≥ 0
  - `is_immediate`: boolean
  - `is_financed`: boolean
- `financing_interest_rate_percent`: float, 0–20
- `financing_repayment_rate_percent`: float, 0–20

---

## 5. Domain Calculation (`src/domain/calculations/renovation.ts`)

### `RenovationBreakdown` interface

| Field | Type | Notes |
|---|---|---|
| `immediateCents` | `number` | Sum of `cost_cents` where `is_immediate = true` |
| `deferredCents` | `number` | Sum of `cost_cents` where `is_immediate = false` |
| `totalMeasuresCents` | `number` | `immediateCents + deferredCents` |
| `newTotalInvestmentCents` | `number` | Previous investment + `totalMeasuresCents` |
| `hasFinancedMeasures` | `boolean` | Any measure with `is_financed = true` |

### `computeRenovationBreakdown(measures, previousInvestmentCents)`

Pure function, no side effects, no UI imports.

---

## 6. Config Defaults (`src/config/wizard-defaults.ts`)

Add to `WizardDefaults`:

| Key | Value | Rationale |
|---|---|---|
| `renovationFinancingInterestPercent` | `3.5` | Typical renovation loan rate 2024 |
| `renovationFinancingRepaymentPercent` | `2.0` | Standard annuity repayment rate |

---

## 7. Acceptance Criteria (Gherkin)

### AC-1: Empty state

```gherkin
GIVEN an authenticated user on step 5 with no saved data
WHEN the page loads
THEN the measures list shows an empty state message
AND a "Maßnahme hinzufügen" dashed-border button is visible
AND the financing section is hidden
AND the sidebar shows previous investment from steps 3+4 and zero measure totals
```

### AC-2: Add a measure

```gherkin
GIVEN an authenticated user on step 5
WHEN they click "Maßnahme hinzufügen"
THEN a new measure card appears with:
  - Empty Bezeichnung text input
  - Cost field defaulting to 0 €
  - Timing toggle defaulting to "Sofort" (is_immediate = true)
  - Fremdfinanziert checkbox unchecked
```

### AC-3: Timing toggle — Sofort

```gherkin
GIVEN a measure card exists
WHEN the timing toggle is ON (checked)
THEN the label "Sofort" is shown in navy
AND the measure is counted in "Sofortmaßnahmen" in the sidebar
```

### AC-4: Timing toggle — Über Jahre

```gherkin
GIVEN a measure card exists
WHEN the timing toggle is OFF (unchecked)
THEN the label "Über Jahre" is shown in muted grey
AND the measure is counted in "Spätere Maßnahmen" in the sidebar
```

### AC-5: Fremdfinanziert — show financing section

```gherkin
GIVEN no measures are marked as fremdfinanziert
THEN the financing details panel is hidden

GIVEN at least one measure is marked as fremdfinanziert
WHEN the user checks the fremdfinanziert checkbox
THEN the financing details panel animates into view
AND it shows Zinssatz (default 3.5%) and Tilgung (default 2.0%)
```

### AC-6: Remove a measure

```gherkin
GIVEN a measure card exists
WHEN the user clicks the trash icon
THEN the card is removed from the list
AND the sidebar totals update immediately
AND if no financed measures remain, the financing panel hides
```

### AC-7: Maximum 20 measures

```gherkin
GIVEN 20 measures already exist
WHEN the user attempts to click "Maßnahme hinzufügen"
THEN the button is disabled
```

### AC-8: Live sidebar updates

```gherkin
GIVEN an authenticated user on step 5
WHEN they change any cost field, toggle, or add/remove a measure
THEN the Impact Preview sidebar immediately reflects:
  - Sofortmaßnahmen total
  - Spätere Maßnahmen total
  - Neue Gesamtinvestition (previous + all measures)
AND no server round-trip occurs
```

### AC-9: Persistence on submit

```gherkin
GIVEN a user fills in measures and clicks "Weiter zur Finanzierung"
THEN data is validated server-side via step5Schema
AND saved to analysis_steps (step_number = 5)
AND measures with cost_cents = 0 AND empty label are filtered before saving
AND the user is navigated to step 6
```

### AC-10: DB hydration on reload

```gherkin
GIVEN a user previously saved step 5 data
WHEN they reload /analysis/[id]/step/5
THEN all saved measures appear in the list with correct values
AND the financing panel shows saved rates if any measure was fremdfinanziert
AND the sidebar shows the correct totals
```

### AC-11: Back navigation

```gherkin
GIVEN an authenticated user on step 5
WHEN they click "Zurück"
THEN they are navigated to /analysis/[id]/step/4
AND no data is lost
```

---

## 8. Implementation Plan

| Concern | File |
|---|---|
| Domain types | `src/domain/types/wizard.ts` → `RenovationMeasure`, `Step5Data` |
| Zod schema | `src/domain/schemas/step5.ts` |
| Domain calculation | `src/domain/calculations/renovation.ts` → `computeRenovationBreakdown` |
| Config defaults | `src/config/wizard-defaults.ts` → add Step 5 defaults |
| Zustand slice | `src/stores/analysis-store.ts` → `step5`, `setStep5` |
| Server action | `src/actions/analysis.ts` → step 5 branch |
| Form component | `src/components/wizard/steps/Step5Form.tsx` |
| Impact sidebar | `src/components/wizard/steps/Step5Form.tsx` → `Step5ImpactPreviewCard` |
| Client shell | `src/components/wizard/steps/Step5Shell.tsx` |
| Page | `src/app/analysis/[id]/step/[step]/page.tsx` (step 5 branch) |

---

## 9. Tests

| Test | File |
|---|---|
| Schema unit tests | `src/__tests__/step5.schema.test.ts` |
| Renovation calc tests | `src/__tests__/renovation.test.ts` |
| Store slice (step5) | `src/__tests__/analysis-store.test.ts` |
