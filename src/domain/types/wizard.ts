/**
 * Shared domain types for the 16-step analysis wizard.
 *
 * @remarks
 * Each step's data is typed as a flat interface. The Zustand store holds
 * one slice per step (e.g. `step1: Partial<Step1Data>`). Derived KPIs are
 * never stored — they are computed on demand from step slices.
 *
 * See ADR-005 (Zustand), ADR-004 (domain types), SPEC-WIZARD-START v1.0.0.
 */

// ---------------------------------------------------------------------------
// Step 1 — Start (intent + experience)
// ---------------------------------------------------------------------------

/**
 * The user's primary investment intent.
 *
 * - `buy_to_rent` — Kapitalanlage (rental income focus)
 * - `buy_to_live`  — Eigennutzung (owner-occupied)
 * - `flip`         — Flip (buy-renovate-sell)
 */
export type WizardIntent = "buy_to_rent" | "buy_to_live" | "flip";

/**
 * The user's self-reported real-estate experience.
 *
 * Drives the level of contextual help shown in later wizard steps.
 */
export type ExperienceLevel = "beginner" | "intermediate" | "expert";

/** Step 1 form data. */
export interface Step1Data {
  intent: WizardIntent;
  experience_level: ExperienceLevel;
}

// ---------------------------------------------------------------------------
// Step 2 — Allgemeine Objektdaten (General Property)
// ---------------------------------------------------------------------------

/**
 * Type of property being analysed.
 *
 * - `wohnung`       — Eigentumswohnung (apartment/condo)
 * - `haus`          — Einfamilienhaus / Doppelhaushälfte (house)
 * - `mfh`           — Mehrfamilienhaus (multi-family building)
 */
export type PropertyType = "wohnung" | "haus" | "mfh";

/**
 * Current occupancy status of the property.
 *
 * - `vermietet`     — Currently tenanted
 * - `leerstehend`   — Vacant
 * - `eigennutzung`  — Owner-occupied
 */
export type OccupancyType = "vermietet" | "leerstehend" | "eigennutzung";

/**
 * Physical condition / renovation state of the property.
 *
 * Used to estimate maintenance reserves and AfA (depreciation) eligibility.
 */
export type PropertyCondition =
  | "neubau"
  | "saniert"
  | "gepflegt"
  | "renovierungsbeduerftig"
  | "sanierungsbeduerftig";

/** Step 2 form data — General Property. See SPEC-WIZARD-STEP2 v1.0.0. */
export interface Step2Data {
  property_type: PropertyType;
  /** Free-text "PLZ / Ort" location string. */
  location: string;
  /** Living area in square metres (m²). Stored as decimal, NOT cents. */
  living_area_sqm: number;
  /** Year the property was built (e.g. 1985). */
  year_built: number;
  /** Planned purchase date as ISO-8601 date string (YYYY-MM-DD). */
  purchase_date: string;
  occupancy_type: OccupancyType;
  condition: PropertyCondition;
}


// ---------------------------------------------------------------------------
// Analysis status
// ---------------------------------------------------------------------------

/** Lifecycle status of an analysis record in the database. */
export type AnalysisStatus = "draft" | "complete" | "archived";
