import { Building2, LogOut, User } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/actions/auth";

/**
 * Application header — async Server Component.
 *
 * @remarks
 * Reads the current Supabase user server-side and renders a user menu
 * with the user's email and a logout button. Uses the glass-panel effect
 * from the design system.
 *
 * The wizard stepper is NOT rendered here — it only appears inside
 * `/analysis/[id]/step/*` routes.
 *
 * See docs/design-system.md §8 for the glass panel specification.
 * See SPEC-AUTH v1.0.0 §4.6.
 */
export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="glass-panel fixed left-0 right-0 top-0 z-50 h-16 border-b border-border/50 shadow-sm">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-600 text-white shadow-glow">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-foreground sm:block">
            PropScape
          </span>
        </Link>

        {/* User actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* User email */}
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-navy-600">
                  <User className="h-4 w-4" />
                </div>
                <span
                  className="max-w-[180px] truncate text-sm font-medium text-foreground"
                  title={user.email}
                >
                  {user.email}
                </span>
              </div>

              {/* Logout */}
              <form action={signOutAction}>
                <Button
                  id="logout-button"
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  aria-label="Abmelden"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Abmelden</span>
                </Button>
              </form>
            </>
          ) : (
            <Link
              href="/auth/login"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Anmelden
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

