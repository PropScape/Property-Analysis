import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Registrieren",
  description: "Erstelle dein PropScape-Konto.",
};

/**
 * Registration page — Server Component.
 *
 * @remarks
 * Redirects to / if the user already has an active session.
 * Renders the RegisterForm Client Component.
 *
 * See SPEC-AUTH v1.0.0 §4.3.
 */
export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Konto erstellen
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Starte deine erste Immobilienanalyse.
      </p>
      <RegisterForm />
    </>
  );
}
