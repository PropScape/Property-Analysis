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
