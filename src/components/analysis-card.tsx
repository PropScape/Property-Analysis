"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Pencil, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AnalysisSummary } from "@/lib/mock-data";

interface AnalysisCardProps {
  analysis: AnalysisSummary;
  /** Called when the user confirms deletion */
  onDelete: (id: string) => void;
  className?: string;
}

/**
 * Formats cents to a German-locale EUR string.
 *
 * @remarks
 * Converts integer cents to EUR display format.
 * Financial precision is maintained: the domain layer works in cents,
 * and this is the UI-layer conversion point.
 */
function formatCents(cents: number): string {
  const eur = cents / 100;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(eur);
}

/**
 * Formats a cashflow value with +/- prefix for display.
 *
 * @remarks
 * Positive cashflow uses emerald color. Negative uses destructive.
 */
function formatCashflow(cents: number): { text: string; isPositive: boolean } {
  const prefix = cents >= 0 ? "+" : "";
  const eur = cents / 100;
  const text = `${prefix}${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(eur)} €/M`;
  return { text, isPositive: cents >= 0 };
}

/**
 * Formats a date string to German locale.
 */
function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(isoString));
}

/**
 * Analysis card for the project overview.
 *
 * @remarks
 * Displays analysis name, location, status badge, KPI snapshot (for
 * completed analyses), last-edited timestamp, and action buttons.
 *
 * See SPEC-PROJECT-LIST §4.2 for the visual specification.
 */
export function AnalysisCard({
  analysis,
  onDelete,
  className,
}: AnalysisCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(analysis.id);
  };

  const editHref = `/analysis/${analysis.id}/step/${analysis.currentStep}`;

  return (
    <div
      className={cn(
        "group flex flex-col rounded-[16px] border border-border bg-card shadow-card transition-colors hover:border-navy-200",
        className
      )}
    >
      {/* Header: icon + status badge */}
      <div className="flex items-start justify-between p-5 pb-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <StatusBadge status={analysis.status} />
      </div>

      {/* Content: name, location, KPIs */}
      <div className="flex flex-1 flex-col px-5 pt-4 pb-4">
        <Link
          href={editHref}
          className="text-base font-semibold text-foreground transition-colors hover:text-navy-600"
        >
          {analysis.name}
        </Link>
        {analysis.location && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {analysis.location}
          </p>
        )}

        {/* KPI row — only for analyses with KPI data */}
        {analysis.kpiSnapshot && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kaufpreis
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">
                {formatCents(analysis.kpiSnapshot.purchasePriceCents)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cashflow
              </p>
              {(() => {
                const cf = formatCashflow(
                  analysis.kpiSnapshot.monthlyCashflowCents
                );
                return (
                  <p
                    className={cn(
                      "mt-0.5 text-sm font-bold",
                      cf.isPositive ? "text-emerald-600" : "text-destructive"
                    )}
                  >
                    {cf.text}
                  </p>
                );
              })()}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rendite
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">
                {analysis.kpiSnapshot.returnOnEquityPercent.toFixed(1)} %
              </p>
            </div>
          </div>
        )}

        {/* Draft step indicator */}
        {analysis.status === "draft" && (
          <p className="mt-4 text-xs text-muted-foreground">
            Schritt {analysis.currentStep} von 16
          </p>
        )}
      </div>

      {/* Footer: last edited + actions */}
      <Separator />
      <div className="flex items-center justify-between px-5 py-3">
        <p className="text-xs text-muted-foreground">
          Zuletzt bearbeitet: {formatDate(analysis.updatedAt)}
        </p>
        <div className="flex items-center gap-1">
          {/* Edit */}
          <Link
            href={editHref}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-navy-50 hover:text-navy-600"
            aria-label={`${analysis.name} bearbeiten`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>

          {/* Duplicate (future feature) */}
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-navy-50 hover:text-navy-600"
            aria-label={`${analysis.name} duplizieren`}
            onClick={() => {
              // TODO: Implement duplication (future spec)
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                aria-label={`${analysis.name} löschen`}
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Analyse löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchten Sie die Analyse &ldquo;{analysis.name}&rdquo;
                  wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
                  werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
