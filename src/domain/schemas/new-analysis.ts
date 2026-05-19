import { z } from "zod";

/**
 * Zod schema for the "create new analysis" name prompt form.
 *
 * @remarks
 * The DB row is only created after this form is submitted — ensuring no
 * orphan records are created if the user abandons the page.
 *
 * See SPEC-WIZARD-START v1.0.0 AC-2, AC-2a.
 *
 * @see {@link https://zod.dev/} Zod v4 documentation
 */
export const newAnalysisSchema = z.object({
  name: z
    .string()
    .min(1, "Name darf nicht leer sein.")
    .max(100, "Maximal 100 Zeichen erlaubt."),
});

export type NewAnalysisInput = z.infer<typeof newAnalysisSchema>;
