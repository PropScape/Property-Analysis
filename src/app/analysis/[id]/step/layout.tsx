import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { StoreHydration } from "@/components/wizard/StoreHydration";
import { WIZARD_STEP_LABELS, WIZARD_STEP_COUNT } from "@/components/wizard/wizard-constants";
import Link from "next/link";
import { Building2 } from "lucide-react";

/**
 * Wizard shell layout metadata.
 *
 * Per-step pages can override `title` via their own `export const metadata`.
 */
export const metadata: Metadata = {
  title: "Analyse-Assistent | PropScape",
  description: "Schritt-für-Schritt-Assistent zur Immobilienanalyse.",
};

interface WizardLayoutProps {
  children: ReactNode;
  /** Dynamic segment `[id]` from the URL. */
  params: Promise<{ id: string }>;
}

/**
 * Wizard shell layout.
 *
 * @remarks
 * This Server Component is responsible for:
 * 1. **Auth gate:** Fetches the analysis by ID and verifies ownership.
 *    Returns 404 if not found or if the user does not own it.
 * 2. **Stepper header:** Renders the glass-panel header with the
 *    `WizardStepper`, using the DB's `current_step` as the authoritative
 *    step state (avoids desync between the URL and the store).
 * 3. **Store hydration:** Mounts `StoreHydration` to trigger the Zustand
 *    `rehydrate()` on the client after the first render.
 *
 * Security: Uses the authenticated Supabase client. The `analyses` RLS
 * policy guarantees the `.eq("user_id", user.id)` filter is enforced at
 * the DB level even if the JS filter is somehow bypassed. See ADR-002.
 *
 * See SPEC-WIZARD-START v1.0.0 §2 (wizard shell).
 */
export default async function WizardLayout({
  children,
  params,
}: WizardLayoutProps) {
  const { id } = await params;

  // Derive the active step from the URL pathname (set by middleware as
  // x-pathname header). This is more accurate than analysis.current_step
  // for stepper highlighting because it reflects the page the user is
  // actually on, not just their furthest-reached step.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  // Path shape: /analysis/[id]/step/[n]
  const urlStepMatch = pathname.match(/\/step\/([\d]+)/);
  const urlStep = urlStepMatch ? parseInt(urlStepMatch[1], 10) : null;

  // 1. Fetch analysis and verify ownership
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: analysis } = await supabase
    .from("analyses")
    .select("id, name, current_step")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!analysis) {
    notFound();
  }

  // Use the URL step for stepper display; fall back to DB value if URL has no step.
  const displayStep =
    urlStep !== null && !isNaN(urlStep) ? urlStep : analysis.current_step;

  return (
    <>
      {/* Trigger Zustand rehydration on client mount */}
      <StoreHydration />

      {/* Glass header with stepper */}
      <header
        className={[
          "sticky top-0 z-20",
          "bg-white/80 backdrop-blur-sm",
          "border-b border-slate-200",
          "px-4 py-3",
        ].join(" ")}
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {/* Brand + analysis name row */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
              aria-label="PropScape – Zur Übersicht"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-600 text-white">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="hidden text-sm font-bold tracking-tight text-slate-900 sm:block">
                PropScape
              </span>
            </Link>

            {/* Step label — name always visible, works on mobile */}
            <div className="flex items-center gap-2 ml-auto">
              <p className="text-sm font-medium text-slate-700 truncate max-w-[180px] hidden sm:block">
                {analysis.name}
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0 bg-slate-100 px-2.5 py-1 rounded-full">
                <span className="text-xs font-semibold text-navy-600">
                  {displayStep}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-600 font-medium">
                  {WIZARD_STEP_LABELS[displayStep] ?? `Schritt ${displayStep}`}
                </span>
                <span className="text-xs text-slate-400">/ {WIZARD_STEP_COUNT}</span>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <WizardStepper currentStep={displayStep} />
        </div>
      </header>

      {/* Step content — max-w-6xl allows the 3-column sidebar layout on step 2+ */}
      <main className="max-w-6xl mx-auto px-4 py-8 pb-32 w-full">
        {children}
      </main>
    </>
  );
}
