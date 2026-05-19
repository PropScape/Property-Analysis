/**
 * Pure calculation functions for Step 4 — Kaufnebenkosten.
 *
 * @remarks
 * Regulatory data (`BUNDESLAND_TAX_RATES`, `BUNDESLAND_OPTIONS`) lives in
 * `src/config/bundesland.ts` — the single source of truth for values that
 * change when German state laws change. This module re-exports them for
 * convenience so callers only need one import path.
 *
 * `computeAncillaryCosts` is a pure function with no side effects.
 *
 * See SPEC-WIZARD-STEP4 v1.0.0.
 */

import type { Bundesland, CustomCostItem } from "@/domain/types/wizard";
import { applyPercent } from "@/domain/calculations/currency";
import { BUNDESLAND_TAX_RATES } from "@/config/bundesland";

// Re-export config so callers can use a single import path.
export { BUNDESLAND_TAX_RATES, BUNDESLAND_OPTIONS } from "@/config/bundesland";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Itemised ancillary cost breakdown produced by `computeAncillaryCosts`. */
export interface AncillaryCostBreakdown {
  /** Maklerprovision in cents. */
  brokerCents: number;
  /** Notarkosten in cents. */
  notaryCents: number;
  /** Grundbucheintrag in cents. */
  landRegistryCents: number;
  /** Grunderwerbsteuer in cents (derived from Bundesland rate). */
  transferTaxCents: number;
  /** Resolved transfer tax percentage for the selected Bundesland. */
  transferTaxPercent: number;
  /** Sum of all `customItems` amounts in cents. */
  customTotalCents: number;
  /** Total of all ancillary costs in cents. */
  totalAncillaryCents: number;
  /** Effective total investment in cents (purchase price + ancillary). */
  totalInvestmentCents: number;
  /**
   * Ancillary costs as a percentage of the purchase price.
   * 0 when purchase price is 0.
   */
  ancillaryRatePercent: number;
}

// ---------------------------------------------------------------------------
// Calculation
// ---------------------------------------------------------------------------

/**
 * Computes the full ancillary cost breakdown for Step 4.
 *
 * @param purchasePriceCents         - Kaufpreis in integer cents.
 * @param brokerFeePercent           - Maklerprovision as a percentage.
 * @param notaryFeePercent           - Notarkosten as a percentage.
 * @param landRegistryFeePercent     - Grundbucheintrag as a percentage.
 * @param bundesland                 - Selected Bundesland key.
 * @param customItems                - User-defined additional cost items.
 *
 * @example
 * computeAncillaryCosts(35_000_000, 3.57, 1.5, 0.5, "NW", [])
 * // → { brokerCents: 1_249_500, transferTaxPercent: 6.5, ancillaryRatePercent: 12.07, ... }
 */
export function computeAncillaryCosts(
  purchasePriceCents: number,
  brokerFeePercent: number,
  notaryFeePercent: number,
  landRegistryFeePercent: number,
  bundesland: Bundesland,
  customItems: CustomCostItem[]
): AncillaryCostBreakdown {
  const transferTaxPercent = BUNDESLAND_TAX_RATES[bundesland];

  const brokerCents = applyPercent(purchasePriceCents, brokerFeePercent);
  const notaryCents = applyPercent(purchasePriceCents, notaryFeePercent);
  const landRegistryCents = applyPercent(purchasePriceCents, landRegistryFeePercent);
  const transferTaxCents = applyPercent(purchasePriceCents, transferTaxPercent);

  const customTotalCents = customItems
    .filter((i) => i.amount_cents > 0)
    .reduce((sum, i) => sum + i.amount_cents, 0);

  const totalAncillaryCents =
    brokerCents + notaryCents + landRegistryCents + transferTaxCents + customTotalCents;

  const totalInvestmentCents = purchasePriceCents + totalAncillaryCents;

  const ancillaryRatePercent =
    purchasePriceCents > 0
      ? (totalAncillaryCents / purchasePriceCents) * 100
      : 0;

  return {
    brokerCents,
    notaryCents,
    landRegistryCents,
    transferTaxCents,
    transferTaxPercent,
    customTotalCents,
    totalAncillaryCents,
    totalInvestmentCents,
    ancillaryRatePercent,
  };
}
