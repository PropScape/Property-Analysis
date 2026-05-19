import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { NewAnalysisForm } from "@/components/wizard/NewAnalysisForm";
import { cn } from "@/lib/utils";

/**
 * SEO metadata for the name-prompt page.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export const metadata: Metadata = {
  title: "Neue Analyse erstellen | PropScape",
  description:
    "Starten Sie eine neue Immobilienanalyse. Geben Sie der Analyse einen Namen und starten Sie den 16-Schritte-Assistenten.",
};

/**
 * Name-prompt entry point for the analysis wizard.
 *
 * @remarks
 * This Server Component renders a simple form that captures a name,
 * then delegates to `createAnalysisAction`. The DB record is only
 * created on submission — no orphan rows if the user abandons the page.
 *
 * After successful submission, `createAnalysisAction` redirects to
 * `/analysis/[id]/step/1`.
 *
 * See SPEC-WIZARD-START v1.0.0 AC-2, AC-3.
 */
export default function NewAnalysisPage() {
  return (
    <>
      <AppHeader />

      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16">
        {/* Card */}
        <div className="w-full max-w-lg">
          {/* Back link */}
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-slate-500 hover:text-slate-800 mb-6 -ml-2 inline-flex"
            )}
            id="new-analysis-back-link"
          >
            <ArrowLeft className="mr-1.5 w-4 h-4" aria-hidden="true" />
            Zurück zur Übersicht
          </Link>

          {/* Glass card */}
          <div
            className={cn(
              "rounded-2xl border border-slate-200 bg-white shadow-sm",
              "p-8"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl bg-navy-600 flex items-center justify-center"
                aria-hidden="true"
              >
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  Neue Analyse
                </h1>
                <p className="text-sm text-slate-500">
                  Schritt 0 von 16 — Grunddaten
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mb-8">
              <div
                className="h-1.5 w-full rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={0}
                aria-valuemin={0}
                aria-valuemax={16}
                aria-label="Wizard-Fortschritt"
              >
                <div className="h-full w-0 rounded-full bg-navy-600" />
              </div>
            </div>

            {/* Intro text */}
            <div className="mb-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Geben Sie der Analyse einen Namen, damit Sie sie später schnell
                wiederfinden. Sie können den Namen jederzeit ändern.
              </p>
            </div>

            {/* Name prompt form */}
            <NewAnalysisForm />
          </div>

          {/* Bottom hint */}
          <p className="text-xs text-slate-400 text-center mt-4">
            Die Analyse wird erst gespeichert, wenn Sie auf „Analyse starten&quot;
            klicken.
          </p>
        </div>
      </main>
    </>
  );
}
