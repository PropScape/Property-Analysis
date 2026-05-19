/**
 * Pure calculation functions for Step 5 — Sanierungsmaßnahmen.
 *
 * @remarks
 * No UI, store, or Next.js imports. All inputs/outputs use domain types.
 * Follows ADR-004 (framework-free domain layer).
 *
 * See SPEC-WIZARD-STEP5 v1.0.0.
 */

import type { RenovationMeasure } from "@/domain/types/wizard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Itemised breakdown produced by `computeRenovationBreakdown`. */
export interface RenovationBreakdown {
  /** Sum of `cost_cents` for measures where `is_immediate = true`. */
  immediateCents: number;
  /** Sum of `cost_cents` for measures where `is_immediate = false`. */
  deferredCents: number;
  /** Total of all measure costs in cents. */
  totalMeasuresCents: number;
  /** Previous investment + totalMeasuresCents. */
  newTotalInvestmentCents: number;
  /** true when at least one measure has `is_financed = true`. */
  hasFinancedMeasures: boolean;
}

// ---------------------------------------------------------------------------
// Calculation
// ---------------------------------------------------------------------------

/**
 * Computes the renovation cost breakdown for the Step 5 Impact Preview sidebar.
 *
 * @param measures                - The current list of renovation measures.
 * @param previousInvestmentCents - Effective total investment from steps 3 + 4
 *   (purchase price + ancillary costs), in integer cents.
 *
 * @example
 * computeRenovationBreakdown(
 *   [{ cost_cents: 2_500_000, is_immediate: true, is_financed: false, ... }],
 *   39_309_500
 * )
 * // → { immediateCents: 2_500_000, deferredCents: 0, totalMeasuresCents: 2_500_000,
 * //     newTotalInvestmentCents: 41_809_500, hasFinancedMeasures: false }
 */
export function computeRenovationBreakdown(
  measures: RenovationMeasure[],
  previousInvestmentCents: number
): RenovationBreakdown {
  let immediateCents = 0;
  let deferredCents = 0;
  let hasFinancedMeasures = false;

  for (const m of measures) {
    if (m.is_immediate) {
      immediateCents += m.cost_cents;
    } else {
      deferredCents += m.cost_cents;
    }
    if (m.is_financed) {
      hasFinancedMeasures = true;
    }
  }

  const totalMeasuresCents = immediateCents + deferredCents;
  const newTotalInvestmentCents = previousInvestmentCents + totalMeasuresCents;

  return {
    immediateCents,
    deferredCents,
    totalMeasuresCents,
    newTotalInvestmentCents,
    hasFinancedMeasures,
  };
}
