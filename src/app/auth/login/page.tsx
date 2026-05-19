import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Anmelden",
  description: "Melde dich bei PropScape an.",
};

/**
 * Login page — Server Component.
 *
 * @remarks
 * Redirects to / if the user already has an active session.
 * Renders the LoginForm Client Component.
 *
 * See SPEC-AUTH v1.0.0 §4.3.
 */
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Willkommen zurück
      </h1>
      <LoginForm />
    </>
  );
}
