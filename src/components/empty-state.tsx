import { Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EmptyStateProps {
  className?: string;
}

/**
 * Empty state displayed when a user has no saved analyses.
 *
 * @remarks
 * Provides a welcoming visual with a clear CTA to create the first analysis.
 * This is the first thing new users see after signing up.
 *
 * See SPEC-PROJECT-LIST §4.3 for the visual specification.
 */
export function EmptyState({ className }: EmptyStateProps) {
  return (
    <div
      className={className}
      role="status"
      aria-label="Keine Analysen vorhanden"
    >
      <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-card px-8 py-16 text-center shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-navy-50 text-navy-600">
          <Building2 className="h-10 w-10" />
        </div>

        <h2 className="mt-6 text-xl font-semibold text-foreground">
          Starten Sie Ihre erste Analyse
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Analysieren Sie Ihre Immobilieninvestments mit professionellen
          Kennzahlen. Cashflow, Rendite und Steuern — alle Daten auf einen
          Blick.
        </p>

        <Link
          href="/analysis/new"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 shadow-glow"
          )}
        >
          Neue Analyse starten
        </Link>
      </div>
    </div>
  );
}
