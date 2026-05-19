/**
 * Zod schema for Step 7 — Hausgeld & Verwaltung.
 *
 * @remarks
 * Validates the operating costs inputs. All values must be non-negative integer cents.
 *
 * See SPEC-WIZARD-STEP7 v1.0.0.
 */
import { z } from "zod";

const nonNegativeCents = (name: string) =>
  z
    .number()
    .int(`${name} muss eine ganze Zahl in Cent sein.`)
    .min(0, `${name} darf nicht negativ sein.`);

export const step7Schema = z.object({
  recoverable_costs_per_month_cents: nonNegativeCents("Umlagefähiges Hausgeld"),
  non_recoverable_costs_per_month_cents: nonNegativeCents("Nicht umlagefähiges Hausgeld"),
  property_management_fee_per_month_cents: nonNegativeCents("Sondereigentumsverwaltung"),
  maintenance_reserve_per_month_cents: nonNegativeCents("Instandhaltungsrücklage"),
  additional_insurance_per_year_cents: nonNegativeCents("Zusatz-Versicherung"),
  other_costs_per_year_cents: nonNegativeCents("Sonstige Nebenkosten"),
});

export type Step7SchemaInput = z.input<typeof step7Schema>;
