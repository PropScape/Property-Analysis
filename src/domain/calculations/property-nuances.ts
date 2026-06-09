/**
 * Pure calculation functions for Step 12 — Objektspezifische Nuancen.
 *
 * @remarks
 * Follows ADR-004 (framework-free domain layer).
 * All monetary output values are integer cents.
 *
 * See SPEC-WIZARD-STEP12 v1.0.0.
 */

import type { SpecialDeductionItem } from "@/domain/types/wizard";

/** Output of `computePropertyNuancesBreakdown`. */
export interface PropertyNuancesBreakdown {
  /** Annual non-recoverable costs (nichtumlagefähig) in integer cents. */
  annualNonRecoverableCents: number;
  /** Annual maintenance costs derived from per-m² rate in integer cents. */
  annualMaintenanceCents: number;
  /** Total annual operating costs (non-recoverable + maintenance) in cents. */
  annualOperatingCostsCents: number;
  /** Sum of all special deduction items in integer cents per year. */
  totalSpecialDeductionsCents: number;
}

/**
 * Computes the annual cost breakdown from Step 12 property-nuance inputs.
 *
 * @remarks
 * - `maintenancePerSqmEuro` is a decimal euro rate (not cents) per m² per month.
 *   It is converted to an annual cents figure here for the KPI sidebar.
 * - `livingAreaSqm` is sourced from Step 2 (`living_area_sqm`).
 * - Rounding is applied via `Math.round` to maintain integer-cent precision.
 *
 * @param nonRecoverableCostsPerMonthCents - Monthly non-recoverable costs in cents
 * @param maintenancePerSqmEuro            - Maintenance rate in €/m²/month (decimal)
 * @param livingAreaSqm                    - Living area from Step 2 in m²
 * @param specialDeductions                - Array of special deduction items
 *
 * @returns A computed `PropertyNuancesBreakdown` object.
 *
 * @see SPEC-WIZARD-STEP12 v1.0.0 §3
 */
export function computePropertyNuancesBreakdown(
  nonRecoverableCostsPerMonthCents: number,
  maintenancePerSqmEuro: number,
  livingAreaSqm: number,
  specialDeductions: SpecialDeductionItem[]
): PropertyNuancesBreakdown {
  const annualNonRecoverableCents = nonRecoverableCostsPerMonthCents * 12;

  // Convert €/m²/month → cents/year: rate × area × 12 months × 100 (€ → cents)
  const annualMaintenanceCents = Math.round(
    maintenancePerSqmEuro * livingAreaSqm * 12 * 100
  );

  const annualOperatingCostsCents =
    annualNonRecoverableCents + annualMaintenanceCents;

  const totalSpecialDeductionsCents = specialDeductions.reduce(
    (sum, item) => sum + item.amount_per_year_cents,
    0
  );

  return {
    annualNonRecoverableCents,
    annualMaintenanceCents,
    annualOperatingCostsCents,
    totalSpecialDeductionsCents,
  };
}
