---
id: SPEC-WIZARD-STEP2
version: 1.0.0
status: active
created: 2026-05-19
---

# SPEC-WIZARD-STEP2: Wizard Step 2 — Allgemeine Objektdaten

## Overview

Implements wizard step 2 ("Objekt / Allgemeine Objektdaten"). The user enters the
physical and legal characteristics of the property being analysed. This data
forms the foundation for all later calculations (AfA, maintenance reserves,
rental yield, etc.).

The page layout follows the HTML mockup in
`Ideation/Initial Design Idea/2-Real Estate - General Property.html` exactly.

---

## Fields

| Field | Type | Required | Values / Constraints |
|---|---|---|---|
| `property_type` | enum | ✅ | `wohnung` · `haus` · `mfh` |
| `location` | string | ✅ | PLZ / Ort, min 2 chars, max 100 |
| `living_area_sqm` | number | ✅ | > 0, ≤ 10 000, two decimal places |
| `year_built` | number | ✅ | 1800 – current year + 5 |
| `purchase_date` | string (ISO date) | ✅ | YYYY-MM-DD, not in the past by more than 10 years |
| `occupancy_type` | enum | ✅ | `vermietet` · `leerstehend` · `eigennutzung` |
| `condition` | enum | ✅ | `neubau` · `saniert` · `gepflegt` · `renovierungsbeduerftig` · `sanierungsbeduerftig` |

---

## Layout Spec (mirrors HTML mockup)

```
┌── Wizard shell header (sticky) ───────────────────────────────┐
│  Logo · Analysis name · Step badge · Stepper                  │
└───────────────────────────────────────────────────────────────┘

┌── KPI Sidebar L ──┐  ┌── Form (max-w-2xl) ───────────────────┐  ┌── KPI Sidebar R ──┐
│ Erwarteter        │  │ h1: Allgemeine Objektdaten             │  │ ROI (Eigenkapital)│
│ Cashflow  (locked)│  │ p: Subtitle                           │  │ (locked)          │
│                   │  │                                       │  │                   │
│ Mietrendite       │  │ ┌─ White card ───────────────────────┐│  │ Cashflow Verlauf  │
│ (locked)          │  │ │ RadioCardGroup: property_type      ││  │ (blurred chart)   │
│                   │  │ │  [Wohnung] [Haus] [Mehrfamilien-   ││  │                   │
└───────────────────┘  │ │           haus]                    ││  └───────────────────┘
                       │ │ <hr>                               ││
                       │ │ Grid 2-col:                        ││
                       │ │  [Standort]       [Wohnfläche m²]  ││
                       │ │  [Baujahr]        [Kaufdatum]      ││
                       │ │ <hr>                               ││
                       │ │ Nutzungsart (SegmentedToggle)      ││
                       │ │ Zustand (Select)                   ││
                       │ │ <Accordion: "Warum diese Daten?"> ││
                       │ └───────────────────────────────────┘│
                       │                                       │
                       │ [← Zurück]  [Weiter zu Kaufpreis →]  │
                       └───────────────────────────────────────┘
```

- **KPI sidebars** are desktop-only (`hidden lg:flex`), `opacity-50`, blurred values.
- **Mobile:** KPI sidebars hidden, StepFooter sticky at bottom.

---

## Acceptance Criteria

### AC-1: Route renders for authenticated analysis owner

```gherkin
GIVEN an authenticated user owns an analysis with id = X
WHEN they navigate to /analysis/X/step/2
THEN the page renders with title "Allgemeine Objektdaten"
  AND the wizard stepper shows step 2 as active
```

### AC-2: Property type RadioCard selection

```gherkin
GIVEN the user is on step 2
WHEN they click the "Haus" card
THEN the "Haus" card shows selected state (navy border + bg + dot)
  AND the previously selected card reverts to default state
```

### AC-3: Form validation — required fields

```gherkin
GIVEN the user submits without filling required fields
WHEN saveStepAction is called
THEN it returns err with a German error message
  AND no analysis_steps row is upserted
```

### AC-4: Successful save navigates to step 3

```gherkin
GIVEN all required fields are valid
WHEN the user clicks "Weiter zu Kaufpreis & Miete"
THEN saveStepAction persists data to analysis_steps (step_number = 2)
  AND the Zustand store is updated with step2 data
  AND the user is navigated to /analysis/[id]/step/3
```

### AC-5: Zustand store persists on reload

```gherkin
GIVEN the user has saved step 2 data
WHEN they reload the page
THEN the form re-populates from the Zustand localStorage store
```

### AC-6: Inline help accordion

```gherkin
GIVEN the user is on step 2
WHEN they click "Warum brauchen wir diese Daten?"
THEN the accordion expands showing the explanation text
```

### AC-7: KPI sidebars locked (desktop)

```gherkin
GIVEN the user is on a desktop viewport (≥ 1024px)
WHEN step 2 renders
THEN left and right KPI sidebar placeholders are visible at opacity-50
  AND their values are blurred / show placeholder text
```

---

## Zod Schema (step2Schema)

```ts
z.object({
  property_type: z.enum(["wohnung", "haus", "mfh"]),
  location:      z.string().min(2).max(100),
  living_area_sqm: z.number().positive().max(10_000),
  year_built:    z.number().int().min(1800).max(new Date().getFullYear() + 5),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  occupancy_type: z.enum(["vermietet", "leerstehend", "eigennutzung"]),
  condition:     z.enum(["neubau","saniert","gepflegt","renovierungsbeduerftig","sanierungsbeduerftig"]),
})
```

---

## Store Slice

```ts
// Add to AnalysisStore:
step2: Partial<Step2Data>;
setStep2: (data: Partial<Step2Data>) => void;
```

---

## New Components

| Component | Location | Description |
|---|---|---|
| `Step2Form` | `src/components/wizard/steps/Step2Form.tsx` | Main form (Client Component) |
| `SegmentedToggle` | `src/components/wizard/SegmentedToggle.tsx` | Reusable segmented radio control |
| `KpiSidebarPlaceholder` | `src/components/wizard/KpiSidebarPlaceholder.tsx` | Locked KPI card (desktop sidebar) |
| `HelpAccordion` | `src/components/wizard/HelpAccordion.tsx` | Expandable inline help |

`RadioCardGroup<T>` (already built in SPEC-WIZARD-START) is reused for property type.

---

## Files to Create / Modify

| Action | File |
|---|---|
| CREATE | `src/domain/types/wizard.ts` — add `Step2Data` |
| CREATE | `src/domain/schemas/step2.ts` |
| MODIFY | `src/stores/analysis-store.ts` — add `step2` slice |
| MODIFY | `src/actions/analysis.ts` — add step 2 branch in `saveStepAction` |
| CREATE | `src/components/wizard/SegmentedToggle.tsx` |
| CREATE | `src/components/wizard/KpiSidebarPlaceholder.tsx` |
| CREATE | `src/components/wizard/HelpAccordion.tsx` |
| CREATE | `src/components/wizard/steps/Step2Form.tsx` |
| MODIFY | `src/app/analysis/[id]/step/[step]/page.tsx` — add step 2 route |
| CREATE | `src/__tests__/step2.schema.test.ts` |
| MODIFY | `docs/traceability.md` |
| MODIFY | `docs/context/state.md` |

---

## Verification Plan

### Automated
- `npx tsc --noEmit` — zero errors
- `npx vitest run` — step2.schema.test.ts passes (≥ 8 tests)
- `npx playwright test e2e/wizard-start.spec.ts` — existing tests still pass

### Manual (browser)
- Step 2 renders correctly at `/analysis/[id]/step/2`
- RadioCards select/deselect correctly
- SegmentedToggle switches correctly
- Accordion opens/closes
- KPI sidebars visible and blurred on desktop, hidden on mobile
- "Weiter" saves and navigates to step 3 (404 for now)
- Back navigates to step 1
