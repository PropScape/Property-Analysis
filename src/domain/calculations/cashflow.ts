/**
 * Pure calculation functions for Step 8 — Initial Cashflow.
 *
 * @remarks
 * Computes the pre-tax cashflow.
 * Follows ADR-004 (framework-free domain layer).
 *
 * See SPEC-WIZARD-STEP8 v1.0.0.
 */

export interface InitialCashflowBreakdown {
  /** Total monthly cashflow in cents (can be negative). */
  monthlyCashflowCents: number;
  /** True if the cashflow is greater than 0. */
  isPositive: boolean;
}

/**
 * Computes the initial pre-tax monthly cashflow.
 *
 * @param monthlyColdRentCents - The monthly cold rent income (Step 3)
 * @param ownerCostsPerMonthCents - The non-recoverable owner operating costs (Step 7)
 * @param monthlyPaymentCents - The monthly debt service (Zins & Tilgung) (Step 6)
 *
 * @returns A computed `InitialCashflowBreakdown` object.
 */
export function computeInitialCashflow(
  monthlyColdRentCents: number,
  ownerCostsPerMonthCents: number,
  monthlyPaymentCents: number
): InitialCashflowBreakdown {
  const monthlyCashflowCents =
    monthlyColdRentCents - ownerCostsPerMonthCents - monthlyPaymentCents;

  return {
    monthlyCashflowCents,
    isPositive: monthlyCashflowCents > 0,
  };
}
