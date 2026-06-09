/**
 * Pure calculation functions for Step 9 — Tax Calculation Start.
 *
 * @remarks
 * Follows ADR-004 (framework-free domain layer).
 *
 * See SPEC-WIZARD-STEP9 v1.0.0.
 */

/**
 * Computes the Return on Equity (Eigenkapitalrendite) based on the user's specific definition.
 *
 * Formula:
 * 1. Mietertrag p.a. = monatliche Kaltmiete * 12
 * 2. Zinszahlungen p.a. = Darlehensbetrag * (Zinssatz / 100)
 * 3. Jahresreinertrag = Mietertrag p.a. - Zinszahlungen p.a.
 * 4. Eigenkapitalrendite = (Jahresreinertrag / eingesetztes Eigenkapital) * 100
 *
 * @param monthlyColdRentCents - The monthly cold rent
 * @param loanAmountCents - The total loan amount
 * @param loanInterestRatePercent - The annual interest rate on the loan
 * @param equityCents - The total equity invested
 *
 * @returns The return on equity as a percentage (e.g. 5.5 for 5.5%), or null if equity is 0.
 */
export function computeReturnOnEquity(
  monthlyColdRentCents: number,
  loanAmountCents: number,
  loanInterestRatePercent: number,
  equityCents: number
): number | null {
  if (equityCents <= 0) {
    return null; // Cannot compute ROE without equity
  }

  const annualRentCents = monthlyColdRentCents * 12;
  const annualInterestCents = loanAmountCents * (loanInterestRatePercent / 100);
  
  const netAnnualIncomeCents = annualRentCents - annualInterestCents;
  
  const roePercent = (netAnnualIncomeCents / equityCents) * 100;

  return roePercent;
}

/**
 * Determines the church tax rate based on the property's state (Bundesland).
 * @param bundesland The standard German state code (e.g. "NW", "BY").
 * @returns 8 for Bayern and Baden-Württemberg, 9 for all other states.
 */
export function getChurchTaxRateForState(bundesland: string): number {
  // Bayern (BY) and Baden-Württemberg (BW) have 8% church tax.
  if (bundesland === "BY" || bundesland === "BW") {
    return 8;
  }
  return 9; // Everyone else is 9%
}

/**
 * Computes the effective tax rate based on the user's legal entity and parameters.
 *
 * @param legalEntity The selected legal entity ("privat", "gmbh", "gewerblich")
 * @param marginalTaxRatePercent The base marginal tax rate (only applies to "privat")
 * @param hasSoli Whether the solidarity surcharge applies (only applies to "privat")
 * @param hasChurchTax Whether church tax applies (only applies to "privat")
 * @param churchTaxRatePercent The applicable church tax rate (8 or 9)
 *
 * @returns The effective tax rate as a percentage (e.g. 48.09)
 */
export function computeEffectiveTaxRate(
  legalEntity: "privat" | "gmbh" | "gewerblich",
  marginalTaxRatePercent: number,
  hasSoli: boolean,
  hasChurchTax: boolean,
  churchTaxRatePercent: number
): number {
  if (legalEntity === "gmbh") {
    // Körperschaftsteuer (15%) + Soli (5.5% on KSt) = 15.825%
    return 15.825;
  }

  if (legalEntity === "gewerblich") {
    // KSt + Soli + average Gewerbesteuer
    // Usually around ~30%
    return 30.0;
  }

  // Private Person
  let effectiveRate = marginalTaxRatePercent;
  
  if (hasSoli) {
    // Soli is 5.5% OF the income tax
    effectiveRate += marginalTaxRatePercent * 0.055;
  }
  
  if (hasChurchTax) {
    // Church tax is 8% or 9% OF the income tax
    effectiveRate += marginalTaxRatePercent * (churchTaxRatePercent / 100);
  }

  return effectiveRate;
}

// ---------------------------------------------------------------------------
// Step 11 — Gebäudeabschreibung (AfA)
// ---------------------------------------------------------------------------

/**
 * Computes the AfA basis (Bemessungsgrundlage) in cents.
 *
 * Formula: (Kaufpreis + Kaufnebenkosten) × (Gebäudeanteil / 100) + Sanierungskosten
 *
 * @param purchasePriceCents      - Purchase price from Step 3 (cents)
 * @param ancillaryCostsCents     - Ancillary acquisition costs from Step 4 (cents)
 * @param renovationCostsCents    - Total renovation costs from Step 5 (cents)
 * @param buildingSharePercent    - Building share as a percentage (0–100)
 *
 * @returns The depreciable basis in integer cents.
 */
export function computeAfaBasis(
  purchasePriceCents: number,
  ancillaryCostsCents: number,
  renovationCostsCents: number,
  buildingSharePercent: number
): number {
  const acquisitionCents = purchasePriceCents + ancillaryCostsCents;
  const buildingPortionCents = Math.round(
    acquisitionCents * (buildingSharePercent / 100)
  );
  return buildingPortionCents + renovationCostsCents;
}

/**
 * Computes the annual depreciation amount in cents.
 *
 * @param afaBasisCents    - The depreciable basis from `computeAfaBasis` (cents)
 * @param afaRatePercent   - The annual depreciation rate (e.g. 2.0 for 2%)
 *
 * @returns Annual depreciation in integer cents.
 */
export function computeAnnualDepreciation(
  afaBasisCents: number,
  afaRatePercent: number
): number {
  return Math.round(afaBasisCents * (afaRatePercent / 100));
}

/**
 * Computes the tax shield (Steuerersparnis) from depreciation.
 *
 * The tax shield represents the actual cash benefit — the depreciation
 * reduces taxable income without real cash outflow.
 *
 * @param annualDepreciationCents - Annual depreciation from `computeAnnualDepreciation`
 * @param effectiveTaxRatePercent - Effective tax rate from `computeEffectiveTaxRate`
 *
 * @returns Tax shield in integer cents per year.
 */
export function computeTaxShield(
  annualDepreciationCents: number,
  effectiveTaxRatePercent: number
): number {
  return Math.round(annualDepreciationCents * (effectiveTaxRatePercent / 100));
}
