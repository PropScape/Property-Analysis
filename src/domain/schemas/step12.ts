/**
 * Zod schema for Step 12 — Objektspezifische Nuancen.
 *
 * @remarks
 * Validates rental modality flags, cost allocation inputs, and the
 * special deductions array.
 *
 * See SPEC-WIZARD-STEP12 v1.0.0.
 */
import { z } from "zod";

const specialDeductionItemSchema = z.object({
  id: z.string().min(1),
  label: z
    .string()
    .min(1, "Bezeichnung darf nicht leer sein.")
    .max(100, "Bezeichnung darf max. 100 Zeichen enthalten."),
  amount_per_year_cents: z
    .number()
    .int("Betrag muss eine ganze Zahl in Cent sein.")
    .min(0, "Betrag darf nicht negativ sein."),
});

export const step12Schema = z.object({
  is_furnished: z.boolean(),
  is_short_term_rental: z.boolean(),

  cost_allocation_type: z.enum(
    ["voll_umlegbar", "teilweise_umlegbar", "nicht_umlegbar"],
    { message: "Ungültige Kostenallokation ausgewählt." }
  ),

  non_recoverable_costs_per_month_cents: z
    .number()
    .int("Monatliche Kosten müssen eine ganze Zahl in Cent sein.")
    .min(0, "Monatliche Kosten dürfen nicht negativ sein."),

  maintenance_per_sqm_euro: z
    .number()
    .min(0, "Instandhaltungsrate darf nicht negativ sein.")
    .max(20, "Instandhaltungsrate darf 20 €/m² nicht überschreiten."),

  special_deductions: z
    .array(specialDeductionItemSchema)
    .max(20, "Maximal 20 Sonderabzüge erlaubt."),
});
