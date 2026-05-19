/**
 * German Bundesland configuration — regulatory tax rates and display labels.
 *
 * @remarks
 * **When to update this file:**
 * The Grunderwerbsteuer rates are set by each Bundesland parliament and change
 * infrequently. When a rate changes:
 * 1. Update the affected entry in `BUNDESLAND_TAX_RATES`.
 * 2. Bump SPEC-WIZARD-STEP4 with a patch version (0.0.Z).
 * 3. The change automatically propagates to all consumers (calculations,
 *    forms, tests) because they import from this single source of truth.
 *
 * **Source:** Official Grunderwerbsteuer rates as published by the
 * Bundesfinanzministerium (as of 2024).
 *
 * @see {@link https://www.bundesfinanzministerium.de/}
 */

import type { Bundesland } from "@/domain/types/wizard";

// ---------------------------------------------------------------------------
// Tax rates
// ---------------------------------------------------------------------------

/**
 * Grunderwerbsteuer rates per Bundesland as percentages.
 *
 * @example
 * BUNDESLAND_TAX_RATES["BY"] // → 3.5
 * BUNDESLAND_TAX_RATES["NW"] // → 6.5
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
} as const;

// ---------------------------------------------------------------------------
// Display options (UI label map, sorted alphabetically by label)
// ---------------------------------------------------------------------------

/**
 * Ordered list of Bundesland select options for forms and dropdowns.
 *
 * @remarks
 * Sorted alphabetically by the German state name so they appear consistently
 * in every dropdown across the application.
 */
export const BUNDESLAND_OPTIONS: ReadonlyArray<{
  readonly key: Bundesland;
  readonly label: string;
}> = [
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
] as const;
