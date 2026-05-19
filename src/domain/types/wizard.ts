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

// ---------------------------------------------------------------------------
// Step 4 — Kaufnebenkosten (Acquisition Ancillary Costs)
// ---------------------------------------------------------------------------

/**
 * A custom cost line-item added by the user in the "Weitere Nebenkosten"
 * repeater. Stored as an array in `Step4Data.custom_items`.
 */
export interface CustomCostItem {
  /** Free-text label (e.g. "Wertgutachten"). */
  label: string;
  /** Amount in integer cents. */
  amount_cents: number;
}

/**
 * German Bundesland identifier for the property transfer tax lookup.
 *
 * The tax rate is a function of the Bundesland — storing the key lets the
 * domain layer look up the rate independently of UI presentation.
 */
export type Bundesland =
  | "BB" // Brandenburg      6.5%
  | "BE" // Berlin           6.0%
  | "BW" // Baden-Württemberg 5.0%
  | "BY" // Bayern            3.5%
  | "HB" // Bremen            5.0%
  | "HE" // Hessen            6.0%
  | "HH" // Hamburg           5.5%
  | "MV" // Mecklenburg-Vorp. 6.0%
  | "NI" // Niedersachsen     5.0%
  | "NW" // Nordrhein-Westfalen 6.5%
  | "RP" // Rheinland-Pfalz   5.0%
  | "SH" // Schleswig-Holstein 6.5%
  | "SL" // Saarland          6.5%
  | "SN" // Sachsen           5.5%
  | "ST" // Sachsen-Anhalt    5.0%
  | "TH"; // Thüringen        6.5%

/**
 * Step 4 form data — Kaufnebenkosten.
 *
 * @remarks
 * Standard costs (Makler, Notar, Grundbuch) are stored as percentage floats
 * so they can be recalculated if the purchase price changes later.
 * Custom items are stored as integer cents.
 *
 * See SPEC-WIZARD-STEP4 v1.0.0.
 */
export interface Step4Data {
  /** Maklerprovision as a percentage (e.g. 3.57 = 3.57%). */
  broker_fee_percent: number;
  /** Notarkosten as a percentage (e.g. 1.5 = 1.5%). */
  notary_fee_percent: number;
  /** Grundbucheintrag as a percentage (e.g. 0.5 = 0.5%). */
  land_registry_fee_percent: number;
  /** Bundesland key — the transfer tax rate is looked up from BUNDESLAND_TAX_RATES. */
  bundesland: Bundesland;
  /** User-defined additional cost line items. */
  custom_items: CustomCostItem[];
}


/**
 * Step 3 form data — Purchase Price & Rent.
 *
 * @remarks
 * All monetary values are stored as **integer cents** to avoid float
 * precision issues. The UI layer formats/parses to EUR display strings.
 *
 * See SPEC-WIZARD-STEP3 v1.0.0.
 */
export interface Step3Data {
  /** Purchase price in integer cents (e.g. 35000000 = 350.000 €). */
  purchase_price_cents: number;
  /** Monthly cold rent in integer cents (e.g. 125000 = 1.250 €). */
  cold_rent_cents: number;
  /** Monthly warm rent in integer cents — optional. */
  warm_rent_cents?: number;
  /** Rent start / property handover date as ISO-8601 date string. */
  rent_start_date: string;
  /**
   * Expected vacancy rate as a percentage (e.g. 2.0 = 2%).
   * Range: 0–10, step 0.5.
   */
  vacancy_rate_percent: number;
  /** Whether annual rent growth is factored in. */
  rent_growth_enabled: boolean;
  /**
   * Annual rent growth rate as a percentage (e.g. 1.5 = 1.5%).
   * Only relevant when `rent_growth_enabled` is true.
   */
  rent_growth_rate_percent?: number;
}

