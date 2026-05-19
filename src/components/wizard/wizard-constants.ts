/**
 * Shared wizard constants — step labels and total step count.
 *
 * @remarks
 * Centralised here so `WizardStepper`, the wizard layout header, and
 * any future breadcrumb / progress components all stay in sync.
 *
 * See SPEC-WIZARD-START v1.0.0 §2.
 */

export const WIZARD_STEP_COUNT = 16;

/** Human-readable name for each of the 16 wizard steps. */
export const WIZARD_STEP_LABELS: Record<number, string> = {
  1: "Start",
  2: "Objekt",
  3: "Lage",
  4: "Kaufpreis",
  5: "Nebenkosten",
  6: "Finanzierung",
  7: "Mieteinnahmen",
  8: "Bewirtschaftung",
  9: "Instandhaltung",
  10: "Steuer",
  11: "Liquidität",
  12: "Rendite",
  13: "Stresstest",
  14: "Risiko",
  15: "Ausstieg",
  16: "Zusammenfassung",
};
