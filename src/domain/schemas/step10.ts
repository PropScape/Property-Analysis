/**
 * Zod schema for Step 10 — Individual Tax Rate.
 *
 * @remarks
 * Validates the user's marginal tax rate and legal entity choice.
 *
 * See SPEC-WIZARD-STEP10 v1.0.0.
 */
import { z } from "zod";

export const step10Schema = z.object({
  legal_entity: z.enum(["privat", "gmbh", "gewerblich"], {
    message: "Ungültige Rechtsform ausgewählt.",
  }),

  marginal_tax_rate_percent: z
    .number()
    .min(0, "Grenzsteuersatz darf nicht negativ sein.")
    .max(45, "Grenzsteuersatz darf 45% nicht überschreiten."),

  has_soli: z.boolean(),
  has_church_tax: z.boolean(),

  notes: z.string().optional(),
});
