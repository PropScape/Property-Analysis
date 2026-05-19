/**
 * Zod schema for Step 8 — Initial Cashflow.
 *
 * @remarks
 * This is a pure dashboard step with no user inputs.
 * The schema validates an empty object.
 *
 * See SPEC-WIZARD-STEP8 v1.0.0.
 */
import { z } from "zod";

export const step8Schema = z.object({}).passthrough();

export type Step8SchemaInput = z.input<typeof step8Schema>;
