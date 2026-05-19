/**
 * Zod schema for Step 4 — Kaufnebenkosten.
 * See SPEC-WIZARD-STEP4 v1.0.0.
 */
import { z } from "zod";

const customItemSchema = z.object({
  label: z.string().min(1, "Bezeichnung darf nicht leer sein.").max(100),
  amount_cents: z
    .number()
    .int()
    .min(0, "Betrag darf nicht negativ sein.")
    .max(10_000_000_00, "Betrag zu hoch."),
});

export const step4Schema = z.object({
  broker_fee_percent: z
    .number()
    .min(0, "Maklerprovision darf nicht negativ sein.")
    .max(10, "Maklerprovision darf 10 % nicht überschreiten."),

  notary_fee_percent: z
    .number()
    .min(0, "Notarkosten dürfen nicht negativ sein.")
    .max(5, "Notarkosten dürfen 5 % nicht überschreiten."),

  land_registry_fee_percent: z
    .number()
    .min(0, "Grundbucheintrag darf nicht negativ sein.")
    .max(5, "Grundbucheintrag darf 5 % nicht überschreiten."),

  bundesland: z.enum([
    "BB", "BE", "BW", "BY", "HB", "HE", "HH", "MV",
    "NI", "NW", "RP", "SH", "SL", "SN", "ST", "TH",
  ], { error: "Bitte ein Bundesland auswählen." }),

  custom_items: z.array(customItemSchema).max(20, "Maximal 20 Positionen erlaubt."),
});
