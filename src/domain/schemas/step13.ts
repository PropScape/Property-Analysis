/**
 * Zod validation schema for Step 13 — Final Cashflow & KPIs.
 *
 * @remarks
 * Step 13 is a read-only results shell — it collects no user input.
 * The empty schema exists solely so `saveStepAction` can advance
 * `current_step` when the user clicks "Weiter" to navigate to Step 14.
 *
 * See SPEC-WIZARD-STEP13 v1.0.0.
 */

import { z } from "zod";

/** Trivial schema: Step 13 has no user input to validate. */
export const step13Schema = z.object({});

export type Step13Schema = z.infer<typeof step13Schema>;
