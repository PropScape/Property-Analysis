import { Building2, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Application header — simplified variant for the project overview.
 *
 * @remarks
 * Uses the glass-panel effect from the design system. Shows the logo
 * and a user avatar button. The wizard stepper is NOT rendered here —
 * it only appears inside `/analysis/[id]/step/*` routes.
 *
 * See docs/design-system.md §8 for the glass panel specification.
 */
export function AppHeader() {
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
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            aria-label="Benutzerprofil"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
