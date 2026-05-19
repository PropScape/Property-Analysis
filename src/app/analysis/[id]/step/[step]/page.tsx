import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Step1Form } from "@/components/wizard/steps/Step1Form";
import { Step2Form } from "@/components/wizard/steps/Step2Form";
import { KpiSidebarPlaceholder } from "@/components/wizard/KpiSidebarPlaceholder";
import { WIZARD_STEP_LABELS } from "@/components/wizard/wizard-constants";
import { TrendingUp, Percent, Scale, BarChart2 } from "lucide-react";

interface StepPageProps {
  params: Promise<{ id: string; step: string }>;
}

/**
 * Dynamic metadata — generates per-step titles.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export async function generateMetadata({
  params,
}: StepPageProps): Promise<Metadata> {
  const { step } = await params;
  const stepNumber = parseInt(step, 10);
  const stepName = WIZARD_STEP_LABELS[stepNumber] ?? `Schritt ${stepNumber}`;

  return {
    title: `Schritt ${stepNumber}: ${stepName} | PropScape`,
    description: `Wizard-Schritt ${stepNumber} der Immobilienanalyse.`,
  };
}

/**
 * Step router — renders the correct step form for the current step number.
 *
 * @remarks
 * Steps with KPI sidebars (step 2+) use a 3-column layout on desktop:
 * left sidebar (locked KPIs) · center form (max-w-2xl) · right sidebar.
 * On mobile the sidebars are hidden and the form is full-width.
 *
 * The `[id]` segment (analysis ID) is forwarded to the step component
 * so it can call `saveStepAction` without drilling through props.
 *
 * See SPEC-WIZARD-START v1.0.0 §2 and SPEC-WIZARD-STEP2 v1.0.0.
 */
export default async function StepPage({ params }: StepPageProps) {
  const { id, step } = await params;
  const stepNumber = parseInt(step, 10);

  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 16) {
    notFound();
  }

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  if (stepNumber === 1) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Investitionsziel &amp; Erfahrung
          </h1>
          <p className="text-slate-500">
            Damit wir die Analyse optimal auf Sie zuschneiden können,
            brauchen wir zwei kurze Angaben.
          </p>
        </div>
        <Step1Form analysisId={id} />
      </>
    );
  }

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  if (stepNumber === 2) {
    return (
      <div className="flex gap-8 items-start justify-center w-full">
        {/* Left KPI sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0 opacity-50 sticky top-6">
          <KpiSidebarPlaceholder
            label="Erwarteter Cashflow"
            helperText="Wird im Verlauf berechnet"
            icon={<TrendingUp className="w-10 h-10" />}
          />
          <KpiSidebarPlaceholder
            label="Mietrendite"
            helperText="Benötigt Kaufpreis & Miete"
            icon={<Percent className="w-10 h-10" />}
          />
        </aside>

        {/* Center: form */}
        <section className="flex-1 min-w-0 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Allgemeine Objektdaten
            </h1>
            <p className="text-slate-500 mt-2">
              Erfasse die Basisdaten deiner Immobilie. Diese bilden das
              Fundament für alle weiteren Berechnungen.
            </p>
          </div>
          <Step2Form analysisId={id} />
        </section>

        {/* Right KPI sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0 opacity-50 sticky top-6">
          <KpiSidebarPlaceholder
            label="ROI (Eigenkapital)"
            helperText="Benötigt Finanzierungsdaten"
            icon={<Scale className="w-10 h-10" />}
          />
          <KpiSidebarPlaceholder
            label="Cashflow Verlauf"
            helperText="Wird nach Schritt 6 berechnet"
            icon={<BarChart2 className="w-10 h-10" />}
          />
        </aside>
      </div>
    );
  }

  // ── Steps 3–16 — not yet implemented ───────────────────────────────────────
  notFound();
}
