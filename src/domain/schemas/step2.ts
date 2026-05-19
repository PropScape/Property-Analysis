import { z } from "zod";
import type { Step2Data } from "@/domain/types/wizard";

/**
 * Zod schema for Step 2 (Allgemeine Objektdaten) form data.
 *
 * @remarks
 * Applied client-side for immediate feedback and server-side in
 * `saveStepAction` as defence-in-depth. German error messages match
 * the app locale.
 *
 * See SPEC-WIZARD-STEP2 v1.0.0 §Zod Schema.
 *
 * @see {@link https://zod.dev/} Zod v4 documentation
 */
export const step2Schema = z.object({
  property_type: z.enum(["wohnung", "haus", "mfh"], {
    error: "Bitte wählen Sie eine Immobilienart aus.",
  }),

  location: z
    .string()
    .min(2, "Standort muss mindestens 2 Zeichen lang sein.")
    .max(100, "Maximal 100 Zeichen erlaubt."),

  living_area_sqm: z
    .number({ error: "Bitte geben Sie eine gültige Wohnfläche ein." })
    .positive("Die Wohnfläche muss größer als 0 sein.")
    .max(10_000, "Wohnfläche darf 10.000 m² nicht überschreiten."),

  year_built: z
    .number({ error: "Bitte geben Sie ein gültiges Baujahr ein." })
    .int("Das Baujahr muss eine ganze Zahl sein.")
    .min(1800, "Das Baujahr darf nicht vor 1800 liegen.")
    .max(
      new Date().getFullYear() + 5,
      `Das Baujahr darf maximal ${new Date().getFullYear() + 5} sein.`
    ),

  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte geben Sie ein gültiges Datum ein (JJJJ-MM-TT)."),

  occupancy_type: z.enum(["vermietet", "leerstehend", "eigennutzung"], {
    error: "Bitte wählen Sie eine Nutzungsart aus.",
  }),

  condition: z.enum(
    [
      "neubau",
      "saniert",
      "gepflegt",
      "renovierungsbeduerftig",
      "sanierungsbeduerftig",
    ],
    {
      error: "Bitte wählen Sie den Zustand der Immobilie aus.",
    }
  ),
}) satisfies z.ZodType<Step2Data>;

export type Step2Input = z.infer<typeof step2Schema>;
