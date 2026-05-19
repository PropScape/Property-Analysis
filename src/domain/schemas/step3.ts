/**
 * Zod schema for Step 3 — Kaufpreis & Miete.
 *
 * @remarks
 * All monetary values are stored and validated as **integer cents**.
 * The UI layer parses German-format strings (e.g. "350.000") to cents
 * before submitting.
 *
 * See SPEC-WIZARD-STEP3 v1.0.0.
 */
import { z } from "zod";

export const step3Schema = z
  .object({
    purchase_price_cents: z
      .number({ error: "Kaufpreis ist erforderlich." })
      .int("Kaufpreis muss eine ganze Zahl in Cent sein.")
      .min(1_00, "Kaufpreis muss größer als 0 € sein.")
      .max(100_000_000_00, "Kaufpreis darf 1 Mrd. € nicht überschreiten."),

    cold_rent_cents: z
      .number({ error: "Kaltmiete ist erforderlich." })
      .int("Kaltmiete muss eine ganze Zahl in Cent sein.")
      .min(1_00, "Kaltmiete muss größer als 0 € sein.")
      .max(100_000_00, "Kaltmiete darf 1 Mio. € nicht überschreiten."),

    warm_rent_cents: z
      .number()
      .int("Warmmiete muss eine ganze Zahl in Cent sein.")
      .min(1_00, "Warmmiete muss größer als 0 € sein.")
      .max(100_000_00, "Warmmiete darf 1 Mio. € nicht überschreiten.")
      .optional(),

    rent_start_date: z
      .string({ error: "Mietbeginn ist erforderlich." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum (JJJJ-MM-TT erwartet."),

    vacancy_rate_percent: z
      .number()
      .min(0, "Leerstand darf nicht negativ sein.")
      .max(10, "Leerstand darf 10 % nicht überschreiten."),

    rent_growth_enabled: z.boolean(),

    rent_growth_rate_percent: z
      .number()
      .min(0, "Mietsteigerung darf nicht negativ sein.")
      .max(20, "Mietsteigerung darf 20 % nicht überschreiten.")
      .optional(),
  })
  .refine(
    (d) =>
      !d.warm_rent_cents ||
      d.warm_rent_cents >= d.cold_rent_cents,
    {
      message: "Warmmiete muss mindestens so hoch wie die Kaltmiete sein.",
      path: ["warm_rent_cents"],
    }
  )
  .refine(
    (d) => !d.rent_growth_enabled || d.rent_growth_rate_percent !== undefined,
    {
      message: "Bitte eine jährliche Steigerungsrate angeben.",
      path: ["rent_growth_rate_percent"],
    }
  );
