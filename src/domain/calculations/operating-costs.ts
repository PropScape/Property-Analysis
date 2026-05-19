/**
 * Pure calculation functions for Step 7 — Hausgeld & Verwaltung.
 *
 * @remarks
 * No UI, store, or Next.js imports. All inputs/outputs use domain types.
 * Follows ADR-004 (framework-free domain layer).
 *
 * See SPEC-WIZARD-STEP7 v1.0.0.
 */
import type { Step7Data } from "@/domain/types/wizard";

export interface OperatingCostsBreakdown {
  /** The owner's monthly cost burden (Nicht umlagefähig + SEV + Instandhaltung) in cents. */
  ownerCostsPerMonthCents: number;
  /** Total annual running costs (ownerCostsPerMonthCents * 12) in cents. */
  annualRunningCostsCents: number;
  /** Total annual one-off costs (Insurance + Other) in cents. */
  annualOneOffCostsCents: number;
  /** Total annual costs to the owner in cents. */
  totalAnnualCostsCents: number;
  /** The cost ratio (Kostenquote) as a percentage (Total Annual Costs / Annual Cold Rent). */
  costRatioPercent: number;
}

/**
 * Computes the operating costs breakdown for the Step 7 Financial Health sidebar.
 *
 * @param data - The Step 7 data containing monthly and annual costs.
 * @param monthlyColdRentCents - The monthly cold rent from Step 3. Required to compute Cost Ratio.
 *
 * @returns A computed `OperatingCostsBreakdown` object.
 */
export function computeOperatingCostsBreakdown(
  data: Step7Data,
  monthlyColdRentCents: number
): OperatingCostsBreakdown {
  // Monthly owner burden
  const ownerCostsPerMonthCents =
    data.non_recoverable_costs_per_month_cents +
    data.property_management_fee_per_month_cents +
    data.maintenance_reserve_per_month_cents;

  const annualRunningCostsCents = ownerCostsPerMonthCents * 12;

  // Annual one-off costs
  const annualOneOffCostsCents =
    data.additional_insurance_per_year_cents + data.other_costs_per_year_cents;

  const totalAnnualCostsCents = annualRunningCostsCents + annualOneOffCostsCents;

  const annualColdRentCents = monthlyColdRentCents * 12;

  const costRatioPercent =
    annualColdRentCents > 0
      ? (totalAnnualCostsCents / annualColdRentCents) * 100
      : 0;

  return {
    ownerCostsPerMonthCents,
    annualRunningCostsCents,
    annualOneOffCostsCents,
    totalAnnualCostsCents,
    costRatioPercent,
  };
}
