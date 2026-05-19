/**
 * Pure calculation functions for Step 6 — Finanzierung.
 *
 * @remarks
 * No UI, store, or Next.js imports. All inputs/outputs use domain types.
 * Follows ADR-004 (framework-free domain layer).
 *
 * The monthly debt service is calculated using the German annuity loan
 * (Annuitätendarlehen) convention:
 * Annual Payment = Amount * (Interest% + Repayment%) / 100
 * Monthly Payment = Annual Payment / 12
 *
 * See SPEC-WIZARD-STEP6 v1.0.0.
 */

export interface FinancingBreakdown {
  /** The calculated loan amount (Total Investment - Equity), minimum 0. */
  loanAmountCents: number;
  /** Loan-to-Value ratio as a percentage. */
  ltvPercent: number;
  /** The monthly annuity payment (Zins + Tilgung) in cents. */
  monthlyPaymentCents: number;
  /** Estimated years to fully pay off the loan. */
  yearsToPayoff: number;
}

/**
 * Computes the financing breakdown for the Step 6 Financial Health sidebar.
 *
 * @param equityCents - User's equity in cents.
 * @param totalInvestmentCents - The total investment required (purchase price + ancillary costs + renovation).
 * @param interestRatePercent - Annual interest rate (e.g. 3.8).
 * @param repaymentRatePercent - Initial annual repayment rate (e.g. 2.0).
 *
 * @returns A computed `FinancingBreakdown` object.
 */
export function computeFinancingBreakdown(
  equityCents: number,
  totalInvestmentCents: number,
  interestRatePercent: number,
  repaymentRatePercent: number
): FinancingBreakdown {
  const loanAmountCents = Math.max(0, totalInvestmentCents - equityCents);
  
  const ltvPercent = totalInvestmentCents > 0
    ? (loanAmountCents / totalInvestmentCents) * 100
    : 0;

  // German Annuity Formula
  // Total annual percentage = (Interest + Repayment) / 100
  // Monthly = Annual / 12
  const combinedRate = (interestRatePercent + repaymentRatePercent) / 100;
  const annualPaymentCents = loanAmountCents * combinedRate;
  const monthlyPaymentCents = Math.round(annualPaymentCents / 12);

  // Estimate years to payoff
  // Formula for exact term: n = ln(1 + interest/repayment) / ln(1 + interest)
  // We'll use a simplified fallback if rates are 0.
  let yearsToPayoff = 0;
  if (repaymentRatePercent > 0 && interestRatePercent > 0) {
    const i = interestRatePercent / 100;
    const t = repaymentRatePercent / 100;
    // Exact formula for German standard annuity (Annuitätendarlehen)
    yearsToPayoff = Math.log(1 + i / t) / Math.log(1 + i);
  } else if (repaymentRatePercent > 0 && interestRatePercent === 0) {
    yearsToPayoff = 100 / repaymentRatePercent;
  }

  return {
    loanAmountCents,
    ltvPercent,
    monthlyPaymentCents,
    yearsToPayoff: Math.round(yearsToPayoff * 10) / 10, // round to 1 decimal place
  };
}
