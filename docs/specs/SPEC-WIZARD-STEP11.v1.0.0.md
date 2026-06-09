---
id: SPEC-WIZARD-STEP11
version: 1.0.0
status: archived
created: 2026-06-09
author: AI Architect
---

# SPEC-WIZARD-STEP11 v1.0.0 — Gebäudeabschreibung (AfA)

## 1. Overview

Implements Step 11: Depreciation (AfA) based on the `12-Real Estate - Depreciation (Af.html` mockup.
This step captures the building/land split, the AfA method, rate, and start date.
It computes the annual depreciation and the resulting tax shield (Steuerersparnis).

## 2. Domain Entities

`Step11Data`
- `building_share_percent`: `number` (0–100)
- `afa_method`: `"linear" | "degressive" | "sonder"`
- `afa_rate_percent`: `number`
- `afa_start_date`: `string` (ISO date, YYYY-MM-DD)

## 3. Business Logic

**AfA Basis (Bemessungsgrundlage)**:
- $AfABasis = (Kaufpreis + Kaufnebenkosten) \times (Gebäudeanteil / 100) + Sanierungskosten$
- Data sourced from Steps 3 (purchase price), 4 (ancillary costs), 5 (renovation costs).

**Annual Depreciation**:
- $JährlicheAbschreibung = AfABasis \times (AfASatz / 100)$

**Tax Shield (Steuerersparnis)**:
- $TaxShield = JährlicheAbschreibung \times (EffektiverSteuersatz / 100)$
- Effective tax rate sourced from Step 10 via `computeEffectiveTaxRate`.

**BMF-Kaufpreisaufteilungs-Helfer**:
- Included as a dummy/placeholder accordion in v1.0.0.
- Functional implementation deferred to a future spec.

## 4. Acceptance Criteria

### AC-1: Building Share Slider
```gherkin
GIVEN I am on Step 11
WHEN I set the building share slider to 80%
AND the total investment (Kaufpreis + Nebenkosten) is 500.000 €
THEN the Gebäudeanteil shows 400.000 €
AND the Grundanteil shows 100.000 €
```

### AC-2: Annual Depreciation Calculation
```gherkin
GIVEN the AfA basis is 400.000 €
AND renovation costs are 25.000 €
AND the AfA rate is 2%
WHEN the annual depreciation is computed
THEN it equals 8.500 € (425.000 × 0.02)
```

### AC-3: Tax Shield Calculation
```gherkin
GIVEN the annual depreciation is 8.000 €
AND the effective tax rate is 42%
WHEN the tax shield is computed
THEN it equals 3.360 €
```

## 5. Traceability
- Updates `src/domain/types/wizard.ts`, `src/domain/calculations/tax-kpis.ts`
- Creates `src/domain/schemas/step11.ts`, `src/components/wizard/steps/Step11Form.tsx`
