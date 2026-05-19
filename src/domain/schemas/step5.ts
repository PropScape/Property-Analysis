/**
 * Zod schema for Step 5 — Sanierungsmaßnahmen.
 *
 * @remarks
 * Each measure's `id` is a client-side UUID — validated as a non-empty
 * string but not as strict UUID format (no uuid library dependency in domain).
 * `cost_cents` is stored as integer cents per the monetary precision rule.
 *
 * Financing fields are always present in the payload; the UI hides them when
 * no measures are `is_financed`, but the schema always validates them.
 *
 * See SPEC-WIZARD-STEP5 v1.0.0.
 */
import { z } from "zod";

const renovationMeasureSchema = z.object({
  id: z.string().min(1, "Maßnahmen-ID darf nicht leer sein."),
  label: z
    .string()
    .min(1, "Bezeichnung darf nicht leer sein.")
    .max(100, "Bezeichnung darf maximal 100 Zeichen lang sein."),
  cost_cents: z
    .number()
    .int("Kosten müssen eine ganze Zahl in Cent sein.")
    .min(0, "Kosten dürfen nicht negativ sein."),
  is_immediate: z.boolean(),
  is_financed: z.boolean(),
});

export const step5Schema = z.object({
  measures: z
    .array(renovationMeasureSchema)
    .max(20, "Maximal 20 Maßnahmen erlaubt."),

  financing_interest_rate_percent: z
    .number()
    .min(0, "Zinssatz darf nicht negativ sein.")
    .max(20, "Zinssatz darf 20 % nicht überschreiten."),

  financing_repayment_rate_percent: z
    .number()
    .min(0, "Tilgung darf nicht negativ sein.")
    .max(20, "Tilgung darf 20 % nicht überschreiten."),
});

export type Step5SchemaInput = z.input<typeof step5Schema>;
