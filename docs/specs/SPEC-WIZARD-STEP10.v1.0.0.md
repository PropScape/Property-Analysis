---
id: SPEC-WIZARD-STEP10
version: 1.0.0
status: archived
created: 2026-05-19
author: AI Architect
---

# SPEC-WIZARD-STEP10 v1.0.0 — Individual Tax Rate

## 1. Overview

Implements Step 10: Individual Tax Rate based on the `11-Real Estate - Individual Tax R.html` mockup.
This step captures the user's legal entity and marginal tax rate assumptions to calculate an effective tax rate.

## 2. Domain Entities

`Step10Data`
- `legal_entity`: `"privat" | "gmbh" | "gewerblich"`
- `marginal_tax_rate_percent`: `number` (0-45)
- `has_soli`: `boolean`
- `has_church_tax`: `boolean`
- `notes`: `string` (optional)

## 3. Business Logic

**Church Tax Rate**:
- Derived from Step 4 (`bundesland`).
- 8% for Bayern and Baden-Württemberg.
- 9% for all other states.

**Effective Tax Rate**:
- If `legal_entity === "gmbh"`: Fixed 15.825% (sliders disabled).
- If `legal_entity === "gewerblich"`: Fixed 30.0% (sliders disabled).
- If `legal_entity === "privat"`:
  $EffectiveRate = BaseRate + (BaseRate \times SoliRate) + (BaseRate \times ChurchRate)$

**Mock Preliminary After-Tax Cashflow**:
- $Taxable = PreTaxCashflow \times 0.8$
- $Tax = Taxable \times EffectiveTaxRate$
- $AfterTax = PreTaxCashflow - Tax$

## 4. Acceptance Criteria

### AC-1: Fixed Tax Rates for Companies
```gherkin
GIVEN I am on Step 10
WHEN I select "gmbh" as my legal entity
THEN the tax rate slider and toggles are disabled
AND the effective tax rate is forced to 15.8%
```

### AC-2: Private Tax Rate Calculation
```gherkin
GIVEN I am on Step 10 with "privat" entity
AND I set the marginal tax rate to 42%
AND I enable Soli (5.5%) and Church Tax (9%)
WHEN the effective tax rate is calculated
THEN it should equal 48.09% (42 + 2.31 + 3.78)
```

## 5. Traceability
- Updates `src/domain/types/wizard.ts`, `src/domain/calculations/tax-kpis.ts`
- Creates `src/components/wizard/steps/Step10Form.tsx`
