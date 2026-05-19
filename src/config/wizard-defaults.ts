/**
 * Application-wide wizard default values.
 *
 * @remarks
 * **Why centralised here?**
 * These values are used to pre-fill wizard form fields when a user starts a
 * new analysis and has no previously saved data. They currently reflect
 * typical German market conditions, but the roadmap includes a per-user
 * Settings page that will let each user override them.
 *
 * **How to support per-user overrides (future):**
 * 1. Persist user settings in the `user_settings` Supabase table.
 * 2. Fetch them in the wizard layout Server Component.
 * 3. Call `resolveWizardDefaults(userSettings)` instead of reading
 *    `WIZARD_DEFAULTS` directly.
 * 4. Pass the resolved defaults down to each step form as a prop.
 *
 * **When to update these values:**
 * Only update when the German market baseline shifts significantly.
 * Per-user changes go through the settings feature, not this file.
 */

import type { Bundesland } from "@/domain/types/wizard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Typed interface for all wizard step defaults.
 *
 * @remarks
 * Kept as a flat interface (not nested by step) so the future settings
 * resolver can merge a partial `UserSettings` object in a single spread.
 */
export interface WizardDefaults {
  // ── Step 3 — Kaufpreis & Miete ──────────────────────────────────────────
  /** Default vacancy rate in percent. Typical German residential: 2%. */
  vacancyRatePercent: number;
  /** Whether rent growth is toggled on by default. */
  rentGrowthEnabled: boolean;
  /** Default annual rent growth rate in percent. */
  rentGrowthRatePercent: number;

  // ── Step 4 — Kaufnebenkosten ─────────────────────────────────────────────
  /** Default broker commission in percent. German market: 3.57% (inc. VAT). */
  brokerFeePercent: number;
  /** Default notary fee in percent. Typical range: 1.0–2.0%. */
  notaryFeePercent: number;
  /** Default land registry fee in percent. Typical range: 0.3–0.7%. */
  landRegistryFeePercent: number;
  /** Default Bundesland for the transfer tax dropdown. */
  defaultBundesland: Bundesland;

  // ── Step 5 — Sanierungsmaßnahmen ─────────────────────────────────────────
  /** Default annual interest rate for a renovation loan in percent. */
  renovationFinancingInterestPercent: number;
  /** Default annual repayment rate for a renovation loan in percent. */
  renovationFinancingRepaymentPercent: number;
}

// ---------------------------------------------------------------------------
// System defaults (German market baseline)
// ---------------------------------------------------------------------------

/**
 * The baseline defaults used when the user has no saved settings.
 *
 * @remarks
 * Broker commission is 3.57% = 3% × 1.19 (VAT) — the most common German
 * rate when both buyer and seller split the commission.
 */
export const WIZARD_DEFAULTS: WizardDefaults = {
  // Step 3
  vacancyRatePercent: 2,
  rentGrowthEnabled: true,
  rentGrowthRatePercent: 1.5,

  // Step 4
  brokerFeePercent: 3.57,
  notaryFeePercent: 1.5,
  landRegistryFeePercent: 0.5,
  defaultBundesland: "NW",

  // Step 5
  renovationFinancingInterestPercent: 3.5,
  renovationFinancingRepaymentPercent: 2.0,
} as const;

// ---------------------------------------------------------------------------
// Resolver (ready for per-user override wiring)
// ---------------------------------------------------------------------------

/**
 * Merges user-specific settings on top of the system defaults.
 *
 * @param userSettings - Partial overrides from the user's settings profile.
 *   Pass `undefined` or an empty object when the user has no custom settings.
 * @returns A fully-resolved `WizardDefaults` object safe to pass to forms.
 *
 * @example
 * // Server Component in the wizard layout:
 * const defaults = resolveWizardDefaults(userSettings ?? {});
 * // → pass `defaults` as a prop to each step Shell
 */
export function resolveWizardDefaults(
  userSettings?: Partial<WizardDefaults>
): WizardDefaults {
  return { ...WIZARD_DEFAULTS, ...userSettings };
}
