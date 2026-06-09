/**
 * Zod schema for Step 11 — Gebäudeabschreibung (AfA).
 *
 * @remarks
 * Validates the building share, depreciation method, rate, and start date.
 *
 * See SPEC-WIZARD-STEP11 v1.0.0.
 */
import { z } from "zod";

export const step11Schema = z.object({
  building_share_percent: z
    .number()
    .min(0, "Gebäudeanteil darf nicht negativ sein.")
    .max(100, "Gebäudeanteil darf 100% nicht überschreiten."),

  afa_method: z.enum(["linear", "degressive", "sonder"], {
    message: "Ungültige AfA-Methode ausgewählt.",
  }),

  afa_rate_percent: z
    .number()
    .min(0, "AfA-Satz darf nicht negativ sein.")
    .max(100, "AfA-Satz darf 100% nicht überschreiten."),

  afa_start_date: z
    .string()
    .min(1, "Bitte ein Startdatum angeben."),
});
