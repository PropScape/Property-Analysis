"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { AnalysisCard } from "@/components/analysis-card";
import { EmptyState } from "@/components/empty-state";
import { deleteAnalysisAction } from "@/actions/analysis";
import { cn } from "@/lib/utils";
import type { AnalysisSummary } from "@/domain/types/analysis-summary";

interface ProjectOverviewContentProps {
  /**
   * Initial list of analyses loaded by the Server Component parent.
   *
   * @remarks
   * The client component mirrors this into local state so it can optimistically
   * remove items on delete without a full page reload.
   */
  initialAnalyses: AnalysisSummary[];
}

/**
 * Project overview content — Client Component (stateful part only).
 *
 * @remarks
 * Extracted from page.tsx so that AppHeader can remain a Server Component.
 * Holds the local analyses state and handles optimistic delete via the
 * `deleteAnalysisAction` Server Action.
 *
 * Data is loaded by the Server Component parent (`src/app/page.tsx`) and
 * passed in via `initialAnalyses`. This conforms to the Clean Architecture
 * rule: Client Components must not fetch from the DB directly.
 *
 * Implements SPEC-PROJECT-LIST v1.0.0.
 */
export function ProjectOverviewContent({
  initialAnalyses,
}: ProjectOverviewContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [analyses, setAnalyses] =
    useState<AnalysisSummary[]>(initialAnalyses);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const completedCount = analyses.filter((a) => a.status === "completed").length;
  const draftCount = analyses.filter((a) => a.status === "draft").length;

  /**
   * Optimistically removes the item from the list, then calls the Server
   * Action. If the action fails, the list is restored and an error message
   * is shown.
   */
  const handleDelete = (id: string) => {
    setDeleteError(null);
    // Optimistic update — remove immediately for instant UI feedback
    const previous = analyses;
    setAnalyses((prev) => prev.filter((a) => a.id !== id));

    startTransition(async () => {
      const result = await deleteAnalysisAction(id);
      if (!result.success) {
        // Roll back optimistic update
        setAnalyses(previous);
        setDeleteError(result.error);
      } else {
        // Refresh server data so the page reflects the real DB state
        router.refresh();
      }
    });
  };

  const isEmpty = analyses.length === 0;

  return (
    <main className="flex-1 px-4 pb-12 pt-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Title row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Meine Analysen
            </h1>
            <p className="mt-1 text-muted-foreground">
              Verwalten Sie Ihre Immobilien-Investmentanalysen
            </p>
          </div>
          <Link
            href="/analysis/new"
            className={cn(buttonVariants({ size: "lg" }), "shadow-glow")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Neue Analyse
          </Link>
        </div>

        {/* Delete error banner */}
        {deleteError && (
          <p
            role="alert"
            aria-live="assertive"
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          >
            {deleteError}
          </p>
        )}

        {isEmpty ? (
          <EmptyState className="mt-10" />
        ) : (
          <>
            {/* Summary statistics */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard count={analyses.length} label="Analysen" />
              <StatCard
                count={completedCount}
                label="Abgeschlossen"
                trailing={<StatusBadge status="completed" />}
              />
              <StatCard
                count={draftCount}
                label="Entwurf"
                trailing={<StatusBadge status="draft" />}
              />
            </div>

            {/* Analysis cards grid */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {analyses.map((analysis) => (
                <AnalysisCard
                  key={analysis.id}
                  analysis={analysis}
                  onDelete={handleDelete}
                  isDeleting={isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
