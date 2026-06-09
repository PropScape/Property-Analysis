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

import type { Bundesland, CostAllocationType } from "@/domain/types/wizard";

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

  // ── Step 7 — Hausgeld & Verwaltung ───────────────────────────────────────
  defaultRecoverableCostsPerMonthCents: number;
  defaultNonRecoverableCostsPerMonthCents: number;
  defaultPropertyManagementFeePerMonthCents: number;
  defaultMaintenanceReservePerMonthCents: number;
  defaultAdditionalInsurancePerYearCents: number;
  defaultOtherCostsPerYearCents: number;

  // ── Step 10 — Individual Tax Rate ────────────────────────────────────────
  defaultLegalEntity: "privat" | "gmbh" | "gewerblich";
  defaultMarginalTaxRatePercent: number;
  defaultHasSoli: boolean;

  // ── Step 11 — Gebäudeabschreibung (AfA) ─────────────────────────────────
  /** Default building share of the purchase price in percent. */
  defaultBuildingSharePercent: number;
  /** Default AfA method. */
  defaultAfaMethod: "linear" | "degressive" | "sonder";
  /** Default AfA rate in percent. */
  defaultAfaRatePercent: number;

  // ── Step 12 — Objektspezifische Nuancen ─────────────────────────────────
  /** Default cost allocation type. */
  defaultCostAllocationType: CostAllocationType;
  /** Default non-recoverable costs per month in cents. */
  defaultNonRecoverableCostsPerMonthCentsStep12: number;
  /** Default maintenance rate in €/m²/month (decimal). */
  defaultMaintenancePerSqmEuro: number;

  // ── Step 13 — Final Cashflow & KPIs ──────────────────────────────────────
  /** Default annual appreciation rate in percent. */
  defaultAppreciationRatePercent: number;
  /** Default vacancy rate for the stress test in percent. */
  defaultStressVacancyPercent: number;
  /** Default interest rate delta for the stress test in percentage points. */
  defaultStressInterestDeltaPp: number;
  /** Default unexpected maintenance cost for the stress test in cents. */
  defaultStressMaintenanceOnceCents: number;
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

  // Step 7
  defaultRecoverableCostsPerMonthCents: 0,
  defaultNonRecoverableCostsPerMonthCents: 0,
  defaultPropertyManagementFeePerMonthCents: 0,
  defaultMaintenanceReservePerMonthCents: 0,
  defaultAdditionalInsurancePerYearCents: 0,
  defaultOtherCostsPerYearCents: 0,

  // Step 10
  defaultLegalEntity: "privat",
  defaultMarginalTaxRatePercent: 42,
  defaultHasSoli: true,

  // Step 11
  defaultBuildingSharePercent: 80,
  defaultAfaMethod: "linear",
  defaultAfaRatePercent: 2.0,

  // Step 12
  defaultCostAllocationType: "nicht_umlegbar",
  defaultNonRecoverableCostsPerMonthCentsStep12: 3500, // 35 €/month
  defaultMaintenancePerSqmEuro: 1.5,

  // Step 13
  defaultAppreciationRatePercent: 2.0,
  defaultStressVacancyPercent: 10.0,
  defaultStressInterestDeltaPp: 2.0,
  defaultStressMaintenanceOnceCents: 500000, // 5.000 €
} as const;

// ---------------------------------------------------------------------------
// Step 12 — Special Deduction Presets (regulatory / reference data per ADR-008)
// ---------------------------------------------------------------------------

/**
 * Shape of a preset deduction item displayed in the Step 12 quick-add list.
 *
 * @remarks
 * These are reference items only — they are NOT stored in the DB.
 * When the user clicks "Hinzufügen", a `SpecialDeductionItem` is created
 * with this label and a zero amount, then appended to their deductions array.
 *
 * Lucide icon names map to the Lucide React icon components.
 * See design-system.md §12 (Iconography).
 */
export interface DeductionPreset {
  id: string;
  label: string;
  /** Lucide icon component name. */
  icon: string;
}

/**
 * Preset quick-add items for the Sonderabzüge section.
 *
 * @remarks
 * Common German rental property tax deductions. Order reflects
 * expected frequency of use.
 *
 * See SPEC-WIZARD-STEP12 v1.0.0 §3.
 */
export const SPECIAL_DEDUCTION_PRESETS: DeductionPreset[] = [
  { id: "travel", label: "Fahrtkosten", icon: "Car" },
  { id: "office", label: "Bürobedarf", icon: "Paperclip" },
  { id: "software", label: "Berufssoftware", icon: "Laptop" },
  { id: "phone", label: "Telefon / Internet", icon: "Phone" },
  { id: "legal", label: "Steuerberater / Rechtsanwalt", icon: "Scale" },
];

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
