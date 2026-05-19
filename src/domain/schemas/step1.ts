import { z } from "zod";
import type { Step1Data } from "@/domain/types/wizard";

/**
 * Zod schema for Step 1 (Start) form data.
 *
 * @remarks
 * Applied twice: once in the Client Component for immediate feedback,
 * and once inside `saveStepAction` as defence-in-depth validation.
 * German error messages match the app locale.
 *
 * See SPEC-WIZARD-START v1.0.0 §4.
 *
 * @see {@link https://zod.dev/} Zod v4 documentation
 */
export const step1Schema = z.object({
  intent: z.enum(["buy_to_rent", "buy_to_live", "flip"], {
    error: "Bitte wählen Sie eine Investitionsart aus.",
  }),
  experience_level: z.enum(["beginner", "intermediate", "expert"], {
    error: "Bitte wählen Sie Ihr Erfahrungsniveau aus.",
  }),
}) satisfies z.ZodType<Step1Data>;

export type Step1Input = z.infer<typeof step1Schema>;
