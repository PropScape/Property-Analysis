/**
 * Zod schema for Step 6 — Finanzierung.
 *
 * @remarks
 * Validates the equity (Eigenkapital) and main loan conditions.
 * Costs are stored as integer cents per the monetary precision rule.
 *
 * See SPEC-WIZARD-STEP6 v1.0.0.
 */
import { z } from "zod";

export const step6Schema = z.object({
  equity_cents: z
    .number()
    .int("Eigenkapital muss eine ganze Zahl in Cent sein.")
    .min(0, "Eigenkapital darf nicht negativ sein."),

  loan_interest_rate_percent: z
    .number()
    .min(0, "Zinssatz darf nicht negativ sein.")
    .max(20, "Zinssatz darf 20 % nicht überschreiten."),

  loan_repayment_rate_percent: z
    .number()
    .min(0, "Tilgung darf nicht negativ sein.")
    .max(20, "Tilgung darf 20 % nicht überschreiten."),

  loan_fixation_years: z.union([
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(20),
  ]),

  loan_processing_fee_cents: z
    .number()
    .int("Bearbeitungsgebühr muss eine ganze Zahl in Cent sein.")
    .min(0, "Bearbeitungsgebühr darf nicht negativ sein.")
    .default(0),
});

export type Step6SchemaInput = z.input<typeof step6Schema>;
