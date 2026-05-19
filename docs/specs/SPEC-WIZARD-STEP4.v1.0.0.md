---
id: SPEC-WIZARD-STEP4
version: 1.0.0
status: archived
created: 2026-05-19
author: AI Architect
---

# SPEC-WIZARD-STEP4 v1.0.0 — Kaufnebenkosten

## 1. Overview

Implements step 4 of the 16-step property analysis wizard.

The user enters all **acquisition ancillary costs** (Kaufnebenkosten):
- Four standard percentage-based fees (broker, notary, land registry, property
  transfer tax). The transfer tax rate is determined by Bundesland selection.
- An arbitrary number of custom flat-fee line items (e.g. Gutachter, Makler
  extras) via a dynamic repeater UI.

A **receipt-style sidebar card** shows a live itemised breakdown of all costs
and the **Effektives Gesamtinvestment** (purchase price + total ancillary),
updated reactively on every field change.

**Key architectural constraints:**
- Standard costs stored as **percentage floats** (re-computable if purchase
  price changes in future).
- Custom items stored as **integer cents**.
- Purchase price is read from the step 3 DB record — fetched in parallel with
  step 4 data by the Server Component.
- Live sidebar driven by `Step4Shell` (same pattern as Step3Shell).

---

## 2. Routes

| Route | Type | Description |
|---|---|---|
| `/analysis/[id]/step/4` | Server Component → Client Shell | Step 4 page |

---

## 3. Domain Types

### `Bundesland` (`src/domain/types/wizard.ts`)

Union of all 16 German state abbreviations: `"BB" | "BE" | "BW" | "BY" | "HB" | "HE" | "HH" | "MV" | "NI" | "NW" | "RP" | "SH" | "SL" | "SN" | "ST" | "TH"`.

### `CustomCostItem` (`src/domain/types/wizard.ts`)

| Field | Type | Notes |
|---|---|---|
| `label` | `string` | 1–100 chars. Free-text name. |
| `amount_cents` | `number` (int) | ≥ 0 |

### `Step4Data` (`src/domain/types/wizard.ts`)

| Field | Type | Notes |
|---|---|---|
| `broker_fee_percent` | `number` | 0–10, default 3.57 |
| `notary_fee_percent` | `number` | 0–5, default 1.5 |
| `land_registry_fee_percent` | `number` | 0–5, default 0.5 |
| `bundesland` | `Bundesland` | Default `"NW"` |
| `custom_items` | `CustomCostItem[]` | Max 20 items |

---

## 4. Bundesland Tax Rates

| Bundesland | Rate |
|---|---|
| Bayern (BY) | 3.5% |
| Baden-Württemberg (BW) | 5.0% |
| Hamburg (HH) | 5.5% |
| Sachsen (SN) | 5.5% |
| Berlin (BE), Hessen (HE), Mecklenburg-Vorpommern (MV) | 6.0% |
| Bremen (HB), Niedersachsen (NI), Rheinland-Pfalz (RP), Sachsen-Anhalt (ST) | 5.0% |
| Brandenburg (BB), Nordrhein-Westfalen (NW), Saarland (SL), Schleswig-Holstein (SH), Thüringen (TH) | 6.5% |

---

## 5. Schema (`src/domain/schemas/step4.ts`)

Validated with Zod v4:

- `broker_fee_percent`: float, 0–10
- `notary_fee_percent`: float, 0–5
- `land_registry_fee_percent`: float, 0–5
- `bundesland`: enum of 16 abbreviations
- `custom_items`: array (max 20) of `{ label: string (1–100), amount_cents: int ≥ 0 }`

---

## 6. Acceptance Criteria (Gherkin)

### AC-1: Standard cost fields render with defaults

```gherkin
GIVEN an authenticated user on step 4
WHEN the page loads with no previously saved data
THEN they see four fields pre-filled with German market defaults:
  - Maklerprovision: 3.57 %
  - Notarkosten: 1.50 %
  - Grundbucheintrag: 0.50 %
  - Grunderwerbsteuer dropdown: "Nordrhein-Westfalen (6,5%)" selected
```

### AC-2: Live EUR amount below each percentage field

```gherkin
GIVEN a purchase price of 350 000 € was entered in step 3
WHEN the user is on step 4
THEN below each percentage input a hint shows the calculated EUR amount
AND the hint updates on every keystroke in the percentage field
```

### AC-3: Bundesland dropdown

```gherkin
GIVEN an authenticated user on step 4
WHEN they open the Grunderwerbsteuer dropdown
THEN all 16 German Bundesländer are listed alphabetically
AND each option shows the state name and its tax rate (e.g. "Bayern (3,5%)")
WHEN they select a different Bundesland
THEN the transfer tax EUR hint below updates immediately
AND the sidebar receipt card updates the Grunderwerb line
```

### AC-4: Custom item repeater — add

```gherkin
GIVEN an authenticated user on step 4
WHEN they click "Position hinzufügen"
THEN a new row appears with a text input for label and a number input for EUR amount
AND a trash icon button to remove the row
```

### AC-5: Custom item repeater — remove

```gherkin
GIVEN a custom item row exists
WHEN the user clicks the trash icon on that row
THEN the row is removed from the list
AND the sidebar receipt card no longer shows that item
```

### AC-6: Custom item repeater — maximum limit

```gherkin
GIVEN 20 custom items are already present
WHEN the user attempts to click "Position hinzufügen"
THEN the button is disabled
```

### AC-7: Sidebar receipt updates in real-time

```gherkin
GIVEN an authenticated user on step 4
WHEN they change any field value
THEN the right sidebar shows:
  - Kaufpreis (from step 3)
  - Itemised ancillary rows (Makler, Notar, Grundbuch, Grunderwerb, custom items)
  - Summe Nebenkosten
  - Nebenkostenquote (as %)
  - Effektives Gesamtinvestment (highlighted in navy)
AND all values update on every keystroke without a server round-trip
```

### AC-8: Data persistence on submit

```gherkin
GIVEN a user fills in all required fields correctly
WHEN they click "Weiter zu Sanierungsmaßnahmen"
THEN the data is validated server-side via step4Schema
AND saved to the analysis_steps table (step_number = 4)
AND empty custom items (no label or zero amount) are filtered out before saving
AND the user is navigated to step 5
```

### AC-9: DB hydration on reload

```gherkin
GIVEN a user previously saved step 4 data
WHEN they reload the page at /analysis/[id]/step/4
THEN all percentage fields show the saved values
AND the Bundesland dropdown shows the saved state
AND all saved custom items appear in the repeater
AND the sidebar receipt initialises with the correct totals
```

### AC-10: Back navigation

```gherkin
GIVEN an authenticated user on step 4
WHEN they click "Zurück"
THEN they are navigated to /analysis/[id]/step/3
AND no data is lost
```

---

## 7. Implementation

| Concern | File |
|---|---|
| Domain types | `src/domain/types/wizard.ts` → `Bundesland`, `CustomCostItem`, `Step4Data` |
| Bundesland tax rates | `src/components/wizard/steps/Step4Form.tsx` → `BUNDESLAND_TAX_RATES` |
| Zod schema | `src/domain/schemas/step4.ts` |
| Zustand slice | `src/stores/analysis-store.ts` → `step4`, `setStep4` |
| Server action | `src/actions/analysis.ts` → `saveStepAction` (step 4 branch) |
| Form component | `src/components/wizard/steps/Step4Form.tsx` |
| Receipt sidebar | `src/components/wizard/steps/Step4Form.tsx` → `Step4InvestmentSummaryCard` |
| Client shell | `src/components/wizard/steps/Step4Shell.tsx` |
| Page | `src/app/analysis/[id]/step/[step]/page.tsx` (step 4 branch) |

---

## 8. Tests

| Test | File |
|---|---|
| Schema unit tests | `src/__tests__/step4.schema.test.ts` |
| Store slice (step4) | `src/__tests__/analysis-store.test.ts` |
