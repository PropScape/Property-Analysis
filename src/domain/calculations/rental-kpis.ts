/**
 * Pure KPI calculation functions for Step 3 — Kaufpreis & Miete.
 *
 * @remarks
 * All inputs are in integer cents. All outputs use sensible domain types.
 * No UI, store, or server imports allowed here.
 *
 * See SPEC-WIZARD-STEP3 v1.0.0.
 */

/** Result of the live KPI computation for Step 3. */
export interface RentalKpis {
  /**
   * Gross yield as a percentage (net-of-vacancy annual rent / purchase price × 100).
   * `null` when either price or rent is missing/zero.
   */
  grossYieldPercent: number | null;
  /**
   * Net annual rent in EUR (after vacancy deduction).
   * `null` when rent is missing.
   */
  netAnnualRentEur: number | null;
  /**
   * Purchase price factor in years (price / net annual rent).
   * `null` when net rent is zero or missing.
   */
  purchasePriceFactor: number | null;
}

/**
 * Computes the three live KPIs shown in the Step 3 sidebar.
 *
 * @param purchasePriceCents - Kaufpreis in integer cents. Pass `null` if empty.
 * @param coldRentCents      - Monthly cold rent in integer cents. Pass `null` if empty.
 * @param vacancyPercent     - Vacancy rate as a percentage (0–10). Defaults to 0.
 *
 * @example
 * computeRentalKpis(35_000_000, 125_000, 2)
 * // → { grossYieldPercent: 4.2, netAnnualRentEur: 14700, purchasePriceFactor: 23.8 }
 */
export function computeRentalKpis(
  purchasePriceCents: number | null,
  coldRentCents: number | null,
  vacancyPercent: number = 0
): RentalKpis {
  if (!purchasePriceCents || !coldRentCents || purchasePriceCents === 0) {
    return {
      grossYieldPercent: null,
      netAnnualRentEur: null,
      purchasePriceFactor: null,
    };
  }

  const vacancyFactor = 1 - vacancyPercent / 100;
  const netAnnualRentCents = coldRentCents * 12 * vacancyFactor;
  const grossYield = (netAnnualRentCents / purchasePriceCents) * 100;
  const factor =
    netAnnualRentCents > 0 ? purchasePriceCents / netAnnualRentCents : null;

  return {
    grossYieldPercent: grossYield,
    netAnnualRentEur: netAnnualRentCents / 100,
    purchasePriceFactor: factor,
  };
}
