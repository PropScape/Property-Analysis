---
id: SPEC-WIZARD-STEP12
version: 1.0.0
status: archived
created: 2026-06-09
author: AI Architect
mockup: "Ideation/Initial Design Idea/13-Real Estate - Property Specifi.html"
---

# SPEC-WIZARD-STEP12 v1.0.0 — Objektspezifische Nuancen

## 1. Overview

Implements Step 12: Property-Specific Nuances based on the
`13-Real Estate - Property Specifi.html` mockup (design-numbered step 13;
wizard implementation step 12).

This step captures three categories of property-specific tax and cost detail
that refine the financial model beyond the operating costs entered in Step 7:

1. **Vermietungsart** — rental modality flags (furnished / short-term).
2. **Kostenallokation** — a cost-allocation type selector plus two numeric
   inputs for non-recoverable monthly costs and per-m² maintenance rate.
3. **Sonderabzüge (optional)** — a custom repeater for individual tax
   deductions (e.g. travel costs, software) with a quick-add preset list.

The right sidebar shows a live **Kosten & Abzüge** summary widget that
updates as the user edits the form.

---

## 2. Domain Entities

### `SpecialDeductionItem`
| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Client-side UUID for React key stability. Not persisted as PK. |
| `label` | `string` | Free-text description (max 100 chars). |
| `amount_per_year_cents` | `number` | Annual deduction in integer cents. |

### `CostAllocationType`
`"voll_umlegbar" | "teilweise_umlegbar" | "nicht_umlegbar"`

### `Step12Data`
| Field | Type | Notes |
|---|---|---|
| `is_furnished` | `boolean` | Möblierte Vermietung — enables furniture depreciation. |
| `is_short_term_rental` | `boolean` | Kurzzeitvermietung (Airbnb etc.) flag. |
| `cost_allocation_type` | `CostAllocationType` | How operating costs are categorised for tax. |
| `non_recoverable_costs_per_month_cents` | `number` | Integer cents /month. |
| `maintenance_per_sqm_euro` | `number` | Decimal euros per m² per month (e.g. `1.5`). |
| `special_deductions` | `SpecialDeductionItem[]` | Array, max 20 items. |

---

## 3. Business Logic

### Annual Operating Costs (Betriebskosten p.a.)
$$
\text{annualNonRecoverableCents} = \text{nonRecoverablePerMonthCents} \times 12
$$
$$
\text{annualMaintenanceCents} = \text{maintenancePerSqmEuro} \times \text{livingAreaSqm} \times 12 \times 100
$$
$$
\text{annualOperatingCostsCents} = \text{annualNonRecoverableCents} + \text{annualMaintenanceCents}
$$

- `livingAreaSqm` is sourced from Step 2 (`living_area_sqm`).
- All final monetary values are rounded to the nearest integer cent.

### Total Special Deductions (Sonderabzüge Gesamt)
$$
\text{totalSpecialDeductionsCents} = \sum_{i} \text{item}_i.\text{amount\_per\_year\_cents}
$$

### Preset Quick-Add Items (config data, not user data)
Sourced from `src/config/wizard-defaults.ts`:
```
SPECIAL_DEDUCTION_PRESETS = [
  { id: "travel", label: "Fahrtkosten", icon: "Car" },
  { id: "office", label: "Bürobedarf", icon: "Paperclip" },
  { id: "software", label: "Berufssoftware", icon: "Laptop" },
  { id: "phone", label: "Telefon/Internet", icon: "Phone" },
  { id: "legal", label: "Steuerberater/Rechtsanwalt", icon: "Scale" },
]
```
When the user clicks "Add" on a preset item, a new `SpecialDeductionItem` is
inserted into the array pre-filled with the label and `amount_per_year_cents = 0`.

---

## 4. Acceptance Criteria

### AC-1: Vermietungsart toggles
```gherkin
GIVEN I am on Step 12
WHEN I enable "Möblierte Vermietung"
THEN the toggle shows active state (navy background)
AND the form stores is_furnished = true

WHEN I enable "Kurzzeitvermietung"
THEN the form stores is_short_term_rental = true
```

### AC-2: Annual operating cost calculation
```gherkin
GIVEN non_recoverable_costs_per_month = 35 €  (3500 cents)
AND maintenance_per_sqm_euro = 1.5
AND living_area_sqm = 80 (from Step 2)
WHEN the sidebar computes Betriebskosten p.a.
THEN annualNonRecoverableCents = 42000  (35 × 12 × 100)
AND annualMaintenanceCents = 144000  (1.5 × 80 × 12 × 100)
AND annualOperatingCostsCents = 186000  (42000 + 144000)
AND the sidebar displays "1.860 €"
```

### AC-3: Special deduction total
```gherkin
GIVEN two deduction items exist: 1200 € and 480 € per year
WHEN the sidebar computes Sonderabzüge Gesamt
THEN totalSpecialDeductionsCents = 168000
AND the sidebar displays "1.680 €"
```

### AC-4: Preset quick-add
```gherkin
GIVEN the "Fahrtkosten" preset is not yet added
WHEN I click "Hinzufügen" next to "Fahrtkosten"
THEN a new row appears in the custom fields section
AND the row label is pre-filled with "Fahrtkosten"
AND the amount defaults to 0 €/Jahr
```

### AC-5: Custom deduction row max
```gherkin
GIVEN 20 deduction rows are already present
WHEN I click "Weiteren Abzug hinzufügen"
THEN no new row is added
AND a toast/inline message warns "Maximale Anzahl erreicht (20)"
```

### AC-6: Save and navigate
```gherkin
GIVEN all required fields are filled
WHEN I click "Weiter zu Zinsen & Gebühren"
THEN saveStepAction is called with stepNumber = 12
AND on success the router navigates to step 13
```

### AC-7: DB hydration on reload
```gherkin
GIVEN step 12 was previously saved
WHEN I navigate back to step 12
THEN all form fields reflect the previously saved values
AND the sidebar KPIs match the saved data
```

---

## 5. Component Architecture

```
Step12Form.tsx          (client component, owns all local state)
└── Left column (w-7/12)
    ├── Page heading
    ├── Accordion: Vermietungsart (Shadcn Switch for each toggle)
    ├── Accordion: Kostenallokation (Select + 2 inputs)
    └── Accordion: Sonderabzüge (preset list + repeater)
└── Right column (w-5/12, sticky)
    ├── Dark KPI widget (Betriebskosten + Sonderabzüge)
    └── Info callout card
```

**Lucide icons used:**
- `Home` — Vermietungsart accordion header
- `ReceiptText` — Kostenallokation accordion header
- `Tags` — Sonderabzüge accordion header
- `Wrench` — Betriebskosten KPI
- `Scissors` — Sonderabzüge KPI
- `Car`, `Paperclip`, `Laptop`, `Phone`, `Scale` — preset deduction icons
- `Plus`, `Trash2` — add/remove row buttons
- `Info` — info callout icon

---

## 6. Traceability

| Layer | Files |
|---|---|
| Domain type | `src/domain/types/wizard.ts` → `SpecialDeductionItem`, `CostAllocationType`, `Step12Data` |
| Schema | `src/domain/schemas/step12.ts` |
| Calculation | `src/domain/calculations/property-nuances.ts` |
| Config | `src/config/wizard-defaults.ts` → `SPECIAL_DEDUCTION_PRESETS`, step 12 defaults |
| Store | `src/stores/analysis-store.ts` → `step12`, `setStep12` |
| Action | `src/actions/analysis.ts` → step 12 branch in `saveStepAction` |
| Component | `src/components/wizard/steps/Step12Form.tsx` |
| Page | `src/app/analysis/[id]/step/[step]/page.tsx` → step 12 case |
| Tests | `src/__tests__/step12.schema.test.ts`, `src/__tests__/property-nuances.test.ts` |

---

## 7. Definition of Done

- [ ] `step12.ts` schema in `src/domain/schemas/`
- [ ] `property-nuances.ts` calculation in `src/domain/calculations/`
- [ ] `Step12Data`, `SpecialDeductionItem`, `CostAllocationType` in `wizard.ts`
- [ ] Defaults & presets in `wizard-defaults.ts`
- [ ] Store slice (`step12`, `setStep12`) in `analysis-store.ts`
- [ ] `saveStepAction` validates step 12 data
- [ ] `Step12Form.tsx` component implemented with full mockup fidelity
- [ ] Step 12 case added to `page.tsx`
- [ ] Wizard constant updated (step 12 label)
- [ ] All Vitest tests pass (schema + calc)
- [ ] `docs/traceability.md` updated
- [ ] `docs/context/state.md` updated
