import type { Metadata } from "next";
import { Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "E-Mail bestätigen",
  description: "Bestätige deine E-Mail-Adresse um fortzufahren.",
};

/**
 * Verify-email confirmation page — static Server Component.
 *
 * @remarks
 * Shown after successful registration. No auth check — the user does
 * NOT have a session yet. They must click the Supabase confirmation
 * email which routes through /auth/callback to complete the flow.
 *
 * See SPEC-AUTH v1.0.0 §3.1 and §4.3.
 */
export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-50 text-navy-600">
        <Mail className="h-8 w-8" />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          E-Mail bestätigen
        </h1>
        <p className="text-sm text-muted-foreground">
          Wir haben dir einen Bestätigungslink geschickt. Bitte überprüfe
          dein Postfach und klicke auf den Link, um dein Konto zu aktivieren.
        </p>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Keine E-Mail erhalten? Prüfe auch deinen Spam-Ordner.
      </p>

      {/* Back to login */}
      <Link
        href="/auth/login"
        className={cn(
          "inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        )}
      >
        Zurück zur Anmeldung
      </Link>
    </div>
  );
}
