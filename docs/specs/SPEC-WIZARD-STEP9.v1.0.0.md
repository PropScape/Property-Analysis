---
id: SPEC-WIZARD-STEP9
version: 1.0.0
status: archived
created: 2026-05-19
author: AI Architect
---

# SPEC-WIZARD-STEP9 v1.0.0 — Tax Calculation Start Screen

## 1. Overview

Implements Step 9 of the property analysis wizard based on the `10-Real Estate - Tax Calculation.html` mockup.
This step acts as an informational "splash" screen before the user dives into detailed tax inputs. It aggregates data from previous steps and calculates three pre-tax KPIs:
- Pre-Tax Cashflow
- Bruttomietrendite
- Eigenkapitalrendite

There are no form inputs on this page. Clicking the primary action button advances the user to Step 10.

---

## 2. Routes

| Route | Type | Description |
|---|---|---|
| `/analysis/[id]/step/9` | Server Component → Client Shell | Step 9 Tax Start Page |

---

## 3. Domain Logic & KPIs (`src/domain/calculations/tax-kpis.ts`)

1. **Pre-Tax Cashflow**: 
   $Kaltmiete - Instandhaltungs\_&\_Verwaltungskosten - Kapitaldienst$
   (Already calculated via `computeInitialCashflow` in `cashflow.ts`)

2. **Bruttomietrendite (Gross Yield)**: 
   $(Kaltmiete_{p.a.} / Kaufpreis) \times 100$
   (Already calculated via `computeRentalKPIs` in `rental-kpis.ts`)

3. **Eigenkapitalrendite (Return on Equity)**:
   - $Mietertrag_{p.a.} = Kaltmiete \times 12$
   - $Jahresreinertrag = Mietertrag_{p.a.} - Zinszahlungen_{p.a.}$
   - $Eigenkapitalrendite = (Jahresreinertrag / eingesetztes\_Eigenkapital) \times 100$

---

## 4. Acceptance Criteria (Gherkin)

### AC-1: Static Informational UI Rendering
```gherkin
GIVEN a user lands on Step 9
WHEN the page loads
THEN a hero section explaining "Steuerliche Betrachtung" is visible
AND an accordion with 3 informational panels is available and the first is open
```

### AC-2: KPI Calculation accuracy
```gherkin
GIVEN monthly cold rent of 1,000 € (12,000 € p.a.)
AND annual interest payment of 3,800 €
AND equity investment of 20,000 €
WHEN the Eigenkapitalrendite is calculated
THEN the Jahresreinertrag is 8,200 €
AND the Eigenkapitalrendite is 41.0 %
```

---

## 5. Implementation Plan

| Concern | File |
|---|---|
| Return on Equity Logic | `src/domain/calculations/tax-kpis.ts` |
| Component | `src/components/wizard/steps/Step9Shell.tsx` |
| Page route | `src/app/analysis/[id]/step/[step]/page.tsx` |
| Tests | `src/__tests__/tax-kpis.test.ts` |
