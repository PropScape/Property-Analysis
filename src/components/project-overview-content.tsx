"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { AnalysisCard } from "@/components/analysis-card";
import { EmptyState } from "@/components/empty-state";
import { MOCK_ANALYSES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { AnalysisSummary } from "@/lib/mock-data";

/**
 * Project overview content — Client Component (stateful part only).
 *
 * @remarks
 * Extracted from page.tsx so that AppHeader can remain a Server Component.
 * Holds the local analyses state and delete handler.
 *
 * Implements SPEC-PROJECT-LIST v1.0.0.
 */
export function ProjectOverviewContent() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>(MOCK_ANALYSES);

  const completedCount = analyses.filter((a) => a.status === "completed").length;
  const draftCount = analyses.filter((a) => a.status === "draft").length;

  const handleDelete = (id: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
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
              {analyses
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
                )
                .map((analysis) => (
                  <AnalysisCard
                    key={analysis.id}
                    analysis={analysis}
                    onDelete={handleDelete}
                  />
                ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
