import { z } from "zod";

/**
 * Zod schemas for auth forms.
 *
 * @remarks
 * German error messages to match the app locale. The same schemas are used
 * on the client (react-hook-form) and inside Server Actions (defence in depth).
 *
 * See SPEC-AUTH v1.0.0 §5.
 */

export const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse."),
  password: z.string().min(1, "Passwort erforderlich."),
});

export const registerSchema = z
  .object({
    email: z.string().email("Ungültige E-Mail-Adresse."),
    password: z.string().min(8, "Mindestens 8 Zeichen erforderlich."),
    confirmPassword: z.string().min(1, "Bitte Passwort bestätigen."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
