"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/domain/auth/auth.schema";

/**
 * Typed result returned from auth Server Actions.
 *
 * @remarks
 * Never throw from a Server Action — always return a typed Result so the
 * Client Component can display the error inline without a full page reload.
 */
export type ActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Sign in with email + password.
 *
 * @remarks
 * Validates via Zod (defence in depth), then delegates to Supabase Auth.
 * Maps Supabase error codes to German user-facing messages.
 *
 * See SPEC-AUTH v1.0.0 §4.1.
 */
export async function signInAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        success: false,
        error: "Bitte bestätige zuerst deine E-Mail-Adresse.",
      };
    }
    return {
      success: false,
      error: "E-Mail oder Passwort ist falsch.",
    };
  }

  redirect("/");
}

/**
 * Register a new account with email + password.
 *
 * @remarks
 * On success, Supabase sends a confirmation email (enable_confirmations = true).
 * The user is NOT logged in until they click the link — redirect to verify-email.
 *
 * See SPEC-AUTH v1.0.0 §4.1.
 */
export async function signUpAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("supabase.co", "")}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return {
        success: false,
        error: "Diese E-Mail-Adresse ist bereits registriert.",
      };
    }
    return { success: false, error: "Registrierung fehlgeschlagen. Bitte versuche es erneut." };
  }

  redirect("/auth/verify-email");
}

/**
 * Sign out the current user and redirect to login.
 *
 * @remarks
 * Must be called from a Server Action (form action or explicit invocation).
 * See SPEC-AUTH v1.0.0 §4.1.
 */
export async function signOutAction(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
