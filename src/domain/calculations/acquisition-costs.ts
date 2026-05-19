/**
 * Domain constants and pure calculation functions for Step 4 — Kaufnebenkosten.
 *
 * @remarks
 * - `BUNDESLAND_TAX_RATES` and `BUNDESLAND_OPTIONS` are domain constants, not
 *   UI concerns; they belong here so server-side validation, reporting, and
 *   future PDF generation can all use the same values.
 * - `computeAncillaryCosts` is a pure function with no side effects.
 *
 * See SPEC-WIZARD-STEP4 v1.0.0.
 */

import type { Bundesland, CustomCostItem } from "@/domain/types/wizard";
import { applyPercent } from "@/domain/calculations/currency";

// ---------------------------------------------------------------------------
// Tax rate constants
// ---------------------------------------------------------------------------

/**
 * Grunderwerbsteuer rates per Bundesland (as of 2024).
 *
 * @remarks
 * Source: official German transfer tax rates. Stored as percentages (e.g. 6.5
 * for 6.5%). Changes require a patch-version bump on SPEC-WIZARD-STEP4.
 */
export const BUNDESLAND_TAX_RATES: Record<Bundesland, number> = {
  BY: 3.5,  // Bayern
  BW: 5.0,  // Baden-Württemberg
  BE: 6.0,  // Berlin
  BB: 6.5,  // Brandenburg
  HB: 5.0,  // Bremen
  HH: 5.5,  // Hamburg
  HE: 6.0,  // Hessen
  MV: 6.0,  // Mecklenburg-Vorpommern
  NI: 5.0,  // Niedersachsen
  NW: 6.5,  // Nordrhein-Westfalen
  RP: 5.0,  // Rheinland-Pfalz
  SL: 6.5,  // Saarland
  SN: 5.5,  // Sachsen
  ST: 5.0,  // Sachsen-Anhalt
  SH: 6.5,  // Schleswig-Holstein
  TH: 6.5,  // Thüringen
};

/** Human-readable Bundesland select options sorted alphabetically by name. */
export const BUNDESLAND_OPTIONS: { key: Bundesland; label: string }[] = [
  { key: "BW", label: "Baden-Württemberg" },
  { key: "BY", label: "Bayern" },
  { key: "BE", label: "Berlin" },
  { key: "BB", label: "Brandenburg" },
  { key: "HB", label: "Bremen" },
  { key: "HH", label: "Hamburg" },
  { key: "HE", label: "Hessen" },
  { key: "MV", label: "Mecklenburg-Vorpommern" },
  { key: "NI", label: "Niedersachsen" },
  { key: "NW", label: "Nordrhein-Westfalen" },
  { key: "RP", label: "Rheinland-Pfalz" },
  { key: "SL", label: "Saarland" },
  { key: "SN", label: "Sachsen" },
  { key: "ST", label: "Sachsen-Anhalt" },
  { key: "SH", label: "Schleswig-Holstein" },
  { key: "TH", label: "Thüringen" },
];

// ---------------------------------------------------------------------------
// Calculation
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
 * computeAncillaryCosts(14_700_000, 3.57, 1.5, 0.5, "NW", [])
 * // → { brokerCents: 524_790, transferTaxPercent: 6.5, ... }
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
