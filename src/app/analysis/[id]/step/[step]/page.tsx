import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Step1Form } from "@/components/wizard/steps/Step1Form";
import { Step2Form } from "@/components/wizard/steps/Step2Form";
import { Step3Form, Step3KpiPreviewCard } from "@/components/wizard/steps/Step3Form";
import { KpiSidebarPlaceholder } from "@/components/wizard/KpiSidebarPlaceholder";
import { WIZARD_STEP_LABELS } from "@/components/wizard/wizard-constants";
import { TrendingUp, Percent, Scale, BarChart2, Landmark } from "lucide-react";
import type { Step1Data, Step2Data, Step3Data } from "@/domain/types/wizard";

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
 * Fetches previously saved step data from the DB for a given step number.
 *
 * @remarks
 * Returns the raw `data` JSON from `analysis_steps`, or `null` if the step
 * has not been saved yet. Used to pre-populate form fields after a page
 * reload — the Zustand store is the in-session cache, the DB is the source
 * of truth across reloads/devices.
 *
 * @param supabase - authenticated Supabase client
 * @param analysisId - UUID of the analysis
 * @param stepNumber - wizard step number (1–16)
 */
async function fetchSavedStepData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  analysisId: string,
  stepNumber: number
): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from("analysis_steps")
    .select("data")
    .eq("analysis_id", analysisId)
    .eq("step_number", stepNumber)
    .single();

  if (!data?.data) return null;
  return data.data as Record<string, unknown>;
}

/**
 * Step router — renders the correct step form for the current step number.
 *
 * @remarks
 * Fetches previously saved step data from the DB and passes it as
 * `initialData` to the form component. This ensures fields are pre-populated
 * after a page reload — the DB is the source of truth, Zustand is a local
 * in-session cache only.
 *
 * Steps with KPI sidebars (step 2+) use a 3-column layout on desktop:
 * left sidebar (locked KPIs) · center form (max-w-2xl) · right sidebar.
 * On mobile the sidebars are hidden and the form is full-width.
 *
 * See SPEC-WIZARD-START v1.0.0 §2 and SPEC-WIZARD-STEP2 v1.0.0.
 */
export default async function StepPage({ params }: StepPageProps) {
  const { id, step } = await params;
  const stepNumber = parseInt(step, 10);

  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 16) {
    notFound();
  }

  const supabase = await createClient();

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  if (stepNumber === 1) {
    const saved = await fetchSavedStepData(supabase, id, 1);

    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Investitionsziel &amp; Erfahrung
          </h1>
          <p className="text-slate-500">
            Damit wir die Analyse optimal auf Sie zuschneiden können,
            brauchen wir zwei kurze Angaben.
          </p>
        </div>
        <Step1Form analysisId={id} initialData={saved as Partial<Step1Data> | null} />
      </div>
    );
  }

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  if (stepNumber === 2) {
    const saved = await fetchSavedStepData(supabase, id, 2);

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
          <Step2Form analysisId={id} initialData={saved as Partial<Step2Data> | null} />
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

  // ── Step 3 ───────────────────────────────────────────────────────────────────────
  if (stepNumber === 3) {
    const saved = await fetchSavedStepData(supabase, id, 3);
    const step3Initial = saved as Partial<Step3Data> | null;

    return (
      <div className="flex gap-8 items-start justify-center w-full">
        {/* Left KPI sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0 opacity-50 sticky top-6">
          <KpiSidebarPlaceholder
            label="Eigenkapitalrendite"
            helperText="Benötigt Finanzierungsdaten"
            icon={<Percent className="w-10 h-10" />}
          />
          <KpiSidebarPlaceholder
            label="Cashflow"
            helperText="Wird nach Schritt 6 berechnet"
            icon={<TrendingUp className="w-10 h-10" />}
          />
        </aside>

        {/* Center: form */}
        <section className="flex-1 min-w-0 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Kaufpreis &amp; Miete
            </h1>
            <p className="text-slate-500 mt-2">
              Trage den Kaufpreis und die erwarteten Mieteinnahmen ein, um
              die erste Rendite-Indikation zu erhalten.
            </p>
          </div>
          <Step3Form analysisId={id} initialData={step3Initial} />
        </section>

        {/* Right sidebar: live KPI preview */}
        <aside className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0 sticky top-6">
          <Step3KpiPreviewCard
            purchaseDisplayValue={step3Initial?.purchase_price_cents
              ? new Intl.NumberFormat("de-DE").format(
                  step3Initial.purchase_price_cents / 100
                )
              : ""}
            coldRentDisplayValue={step3Initial?.cold_rent_cents
              ? new Intl.NumberFormat("de-DE").format(
                  step3Initial.cold_rent_cents / 100
                )
              : ""}
            vacancyRate={step3Initial?.vacancy_rate_percent ?? 2}
          />
          <KpiSidebarPlaceholder
            label="Kaufnebenkosten"
            helperText="Nächster Schritt: Notar &amp; Steuer"
            icon={<Landmark className="w-10 h-10" />}
          />
        </aside>
      </div>
    );
  }

  // ── Steps 4–16 — not yet implemented ──────────────────────────────────────────────────
  notFound();
}
