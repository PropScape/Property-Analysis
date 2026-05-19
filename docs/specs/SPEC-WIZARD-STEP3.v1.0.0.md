---
id: SPEC-WIZARD-STEP3
version: 1.0.0
status: archived
created: 2026-05-19
author: AI Architect
---

# SPEC-WIZARD-STEP3 v1.0.0 — Kaufpreis & Miete

## 1. Overview

Implements step 3 of the 16-step property analysis wizard.

The user enters the **purchase price** and **rental income** details for the
property. A live KPI sidebar card computes the gross yield, net annual rent,
and purchase price factor in real-time as the user types — without a server
round-trip.

**Key architectural constraints:**
- All monetary fields are stored as **integer cents** (never floats).
- DB is the **source of truth** on reload; Zustand is an in-session cache only.
- The live KPI sidebar is driven by shared state in a client-side Shell wrapper
  (`Step3Shell`) so the form and the card stay in sync.

---

## 2. Routes

| Route | Type | Description |
|---|---|---|
| `/analysis/[id]/step/3` | Server Component → Client Shell | Step 3 page |

---

## 3. Domain Types

### `Step3Data` (`src/domain/types/wizard.ts`)

| Field | Type | Notes |
|---|---|---|
| `purchase_price_cents` | `number` (int) | Required. Kaufpreis ohne Nebenkosten. |
| `cold_rent_cents` | `number` (int) | Required. Monatliche Kaltmiete. |
| `warm_rent_cents` | `number` (int) | Optional. |
| `rent_start_date` | `string` (ISO date) | Required. YYYY-MM-DD. |
| `vacancy_rate_percent` | `number` | Required. 0–10, default 2. |
| `rent_growth_enabled` | `boolean` | Default `true`. |
| `rent_growth_rate_percent` | `number` | Optional. Active when toggle is on. |

---

## 4. Schema (`src/domain/schemas/step3.ts`)

Validated with Zod v4:

- `purchase_price_cents`: integer, min 100 (= 1 €), max 100 000 000 00
- `cold_rent_cents`: integer, min 100, max 100 000 00
- `warm_rent_cents`: optional integer ≥ 100
- `rent_start_date`: ISO date regex `YYYY-MM-DD`
- `vacancy_rate_percent`: float, 0–10
- `rent_growth_rate_percent`: optional float, 0–20

---

## 5. Acceptance Criteria (Gherkin)

### AC-1: Purchase price field renders

```gherkin
GIVEN an authenticated user on step 3
WHEN the page loads
THEN they see a large EUR text input labelled "Kaufpreis der Immobilie"
AND the input is right-aligned with bold typography
AND a Euro icon appears on the left
AND the field is marked as required
```

### AC-2: Rent inputs render

```gherkin
GIVEN an authenticated user on step 3
WHEN the page loads
THEN they see a "Kaltmiete (monatlich)" input (required)
AND they see a "Warmmiete" input (optional)
AND they see a date input "Mietbeginn / Übernahme" (required)
```

### AC-3: Vacancy rate slider

```gherkin
GIVEN an authenticated user on step 3
WHEN they interact with the vacancy rate slider
THEN the slider moves from 0 % to 10 % in 0.5 % steps
AND the current value is displayed as "X.X %" next to the label
AND the default value is 2 %
```

### AC-4: Rent growth toggle

```gherkin
GIVEN an authenticated user on step 3
WHEN the rent growth toggle is ON (default)
THEN a "Jährliche Steigerung" number input is visible
WHEN the toggle is switched OFF
THEN the "Jährliche Steigerung" input disappears
```

### AC-5: Live KPI sidebar updates in real-time

```gherkin
GIVEN an authenticated user on step 3
WHEN they type a purchase price and cold rent
THEN the right sidebar shows:
  - Bruttomietrendite (as a percentage with 2 decimal places)
  - Nettokaltmiete p.a. (after vacancy deduction)
  - Kaufpreisfaktor (in years)
AND all three values update on every keystroke without a server round-trip
```

### AC-6: KPI colour indicator

```gherkin
GIVEN the Bruttomietrendite is calculated
WHEN the value is ≥ 5 %
THEN the value text is emerald-coloured with label "Sehr guter Wert (> 5%)"
WHEN the value is ≥ 4 % and < 5 %
THEN the value text is emerald-coloured with label "Solider Wert (> 4%)"
WHEN the value is ≥ 2 % and < 4 %
THEN the value text is amber-coloured with label "Unterdurchschnittlich"
WHEN the value is < 2 %
THEN the value text is red-coloured with label "Kritischer Wert (< 2%)"
```

### AC-7: Data persistence on submit

```gherkin
GIVEN a user fills in all required fields correctly
WHEN they click "Weiter zu Kaufnebenkosten"
THEN the data is validated server-side via step3Schema
AND saved to the analysis_steps table (step_number = 3)
AND the user is navigated to step 4
```

### AC-8: DB hydration on reload

```gherkin
GIVEN a user previously saved step 3 data
WHEN they reload the page at /analysis/[id]/step/3
THEN all fields are pre-populated with the saved values
AND the live KPI sidebar initialises with the saved values
```

### AC-9: Validation errors

```gherkin
GIVEN a user submits the form with purchase_price_cents missing
THEN a server-side validation error is shown below the form
AND the user stays on step 3
```

---

## 6. Implementation

| Concern | File |
|---|---|
| Domain type | `src/domain/types/wizard.ts` → `Step3Data` |
| Zod schema | `src/domain/schemas/step3.ts` |
| Zustand slice | `src/stores/analysis-store.ts` → `step3`, `setStep3` |
| Server action | `src/actions/analysis.ts` → `saveStepAction` (step 3 branch) |
| Form component | `src/components/wizard/steps/Step3Form.tsx` |
| KPI card | `src/components/wizard/steps/Step3Form.tsx` → `Step3KpiPreviewCard` |
| Client shell | `src/components/wizard/steps/Step3Shell.tsx` |
| Page | `src/app/analysis/[id]/step/[step]/page.tsx` (step 3 branch) |

---

## 7. Tests

| Test | File |
|---|---|
| Schema unit tests | `src/__tests__/step3.schema.test.ts` |
| Store slice (step3) | `src/__tests__/analysis-store.test.ts` |
