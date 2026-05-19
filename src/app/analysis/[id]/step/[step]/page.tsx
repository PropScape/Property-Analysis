import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Step1Form } from "@/components/wizard/steps/Step1Form";
import { Step2Form } from "@/components/wizard/steps/Step2Form";
import { Step3Shell } from "@/components/wizard/steps/Step3Shell";
import { Step4Shell } from "@/components/wizard/steps/Step4Shell";
import { Step5Shell } from "@/components/wizard/steps/Step5Shell";
import { Step6Shell } from "@/components/wizard/steps/Step6Shell";
import { Step7Shell } from "@/components/wizard/steps/Step7Shell";
import { Step8Shell } from "@/components/wizard/steps/Step8Shell";
import { KpiSidebarPlaceholder } from "@/components/wizard/KpiSidebarPlaceholder";
import { WIZARD_STEP_LABELS } from "@/components/wizard/wizard-constants";
import { TrendingUp, Percent, Scale, BarChart2 } from "lucide-react";
import type { Step1Data, Step2Data, Step3Data, Step4Data, Step5Data, Step6Data, Step7Data } from "@/domain/types/wizard";
import { computeAncillaryCosts } from "@/domain/calculations/acquisition-costs";
import { computeRenovationBreakdown } from "@/domain/calculations/renovation";
import { computeFinancingBreakdown } from "@/domain/calculations/financing";
import { computeOperatingCostsBreakdown } from "@/domain/calculations/operating-costs";
import { WIZARD_DEFAULTS } from "@/config/wizard-defaults";

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
    return (
      <Step3Shell
        analysisId={id}
        initialData={saved as Partial<Step3Data> | null}
      />
    );
  }

  // ── Step 4 ───────────────────────────────────────────────────────────────────────
  if (stepNumber === 4) {
    // Fetch step 3 for purchase price (needed for live EUR calculations)
    const [step3Saved, step4Saved] = await Promise.all([
      fetchSavedStepData(supabase, id, 3),
      fetchSavedStepData(supabase, id, 4),
    ]);

    const step3 = step3Saved as { purchase_price_cents?: number } | null;
    const purchasePriceCents = step3?.purchase_price_cents ?? 0;

    return (
      <Step4Shell
        analysisId={id}
        initialData={step4Saved as Partial<Step4Data> | null}
        purchasePriceCents={purchasePriceCents}
      />
    );
  }

  // ── Step 5 ──────────────────────────────────────────────────────────────────
  if (stepNumber === 5) {
    const [step3Saved, step4Saved, step5Saved] = await Promise.all([
      fetchSavedStepData(supabase, id, 3),
      fetchSavedStepData(supabase, id, 4),
      fetchSavedStepData(supabase, id, 5),
    ]);

    const step3 = step3Saved as { purchase_price_cents?: number } | null;
    const purchasePriceCents = step3?.purchase_price_cents ?? 0;

    const step4 = step4Saved as Partial<Step4Data> | null;
    const { totalAncillaryCents } = computeAncillaryCosts(
      purchasePriceCents,
      step4?.broker_fee_percent ?? WIZARD_DEFAULTS.brokerFeePercent,
      step4?.notary_fee_percent ?? WIZARD_DEFAULTS.notaryFeePercent,
      step4?.land_registry_fee_percent ?? WIZARD_DEFAULTS.landRegistryFeePercent,
      step4?.bundesland ?? WIZARD_DEFAULTS.defaultBundesland,
      step4?.custom_items ?? []
    );

    const previousInvestmentCents = purchasePriceCents + totalAncillaryCents;

    return (
      <Step5Shell
        analysisId={id}
        initialData={step5Saved as Partial<Step5Data> | null}
        previousInvestmentCents={previousInvestmentCents}
      />
    );
  }

  // ── Step 6 ──────────────────────────────────────────────────────────────────
  if (stepNumber === 6) {
    const [step3Saved, step4Saved, step5Saved, step6Saved] = await Promise.all([
      fetchSavedStepData(supabase, id, 3),
      fetchSavedStepData(supabase, id, 4),
      fetchSavedStepData(supabase, id, 5),
      fetchSavedStepData(supabase, id, 6),
    ]);

    const step3 = step3Saved as { purchase_price_cents?: number } | null;
    const purchasePriceCents = step3?.purchase_price_cents ?? 0;

    const step4 = step4Saved as Partial<Step4Data> | null;
    const { totalAncillaryCents } = computeAncillaryCosts(
      purchasePriceCents,
      step4?.broker_fee_percent ?? WIZARD_DEFAULTS.brokerFeePercent,
      step4?.notary_fee_percent ?? WIZARD_DEFAULTS.notaryFeePercent,
      step4?.land_registry_fee_percent ?? WIZARD_DEFAULTS.landRegistryFeePercent,
      step4?.bundesland ?? WIZARD_DEFAULTS.defaultBundesland,
      step4?.custom_items ?? []
    );

    const step5 = step5Saved as Partial<Step5Data> | null;
    const { newTotalInvestmentCents } = computeRenovationBreakdown(
      step5?.measures ?? [],
      purchasePriceCents + totalAncillaryCents
    );

    return (
      <Step6Shell
        analysisId={id}
        initialData={step6Saved as Partial<Step6Data> | null}
        totalInvestmentCents={newTotalInvestmentCents}
        defaultInterestRate={WIZARD_DEFAULTS.renovationFinancingInterestPercent}
        defaultRepaymentRate={WIZARD_DEFAULTS.renovationFinancingRepaymentPercent}
        defaultFixationYears={10}
      />
    );
  }

  // ── Step 7 ──────────────────────────────────────────────────────────────────
  if (stepNumber === 7) {
    const [step3Saved, step7Saved] = await Promise.all([
      fetchSavedStepData(supabase, id, 3),
      fetchSavedStepData(supabase, id, 7),
    ]);

    const step3 = step3Saved as { cold_rent_cents?: number } | null;
    const monthlyColdRentCents = step3?.cold_rent_cents ?? 0;

    return (
      <Step7Shell
        analysisId={id}
        initialData={step7Saved as Partial<Step7Data> | null}
        monthlyColdRentCents={monthlyColdRentCents}
        defaultRecoverable={WIZARD_DEFAULTS.defaultRecoverableCostsPerMonthCents}
        defaultNonRecoverable={WIZARD_DEFAULTS.defaultNonRecoverableCostsPerMonthCents}
        defaultManagement={WIZARD_DEFAULTS.defaultPropertyManagementFeePerMonthCents}
        defaultMaintenance={WIZARD_DEFAULTS.defaultMaintenanceReservePerMonthCents}
        defaultInsurance={WIZARD_DEFAULTS.defaultAdditionalInsurancePerYearCents}
        defaultOther={WIZARD_DEFAULTS.defaultOtherCostsPerYearCents}
      />
    );
  }

  // ── Step 8 ──────────────────────────────────────────────────────────────────
  if (stepNumber === 8) {
    // We need data from steps 3, 4, 5, 6, 7 to compute everything
    const [step3Saved, step4Saved, step5Saved, step6Saved, step7Saved] = await Promise.all([
      fetchSavedStepData(supabase, id, 3),
      fetchSavedStepData(supabase, id, 4),
      fetchSavedStepData(supabase, id, 5),
      fetchSavedStepData(supabase, id, 6),
      fetchSavedStepData(supabase, id, 7),
    ]);

    // 1. Rent Income
    const step3 = step3Saved as Partial<Step3Data> | null;
    const monthlyColdRentCents = step3?.cold_rent_cents ?? 0;
    const purchasePriceCents = step3?.purchase_price_cents ?? 0;

    // 2. Ancillary Costs
    const step4 = step4Saved as Partial<Step4Data> | null;
    const { totalAncillaryCents } = computeAncillaryCosts(
      purchasePriceCents,
      step4?.broker_fee_percent ?? WIZARD_DEFAULTS.brokerFeePercent,
      step4?.notary_fee_percent ?? WIZARD_DEFAULTS.notaryFeePercent,
      step4?.land_registry_fee_percent ?? WIZARD_DEFAULTS.landRegistryFeePercent,
      step4?.bundesland ?? WIZARD_DEFAULTS.defaultBundesland,
      step4?.custom_items ?? []
    );

    // 3. Renovation (to get newTotalInvestmentCents)
    const step5 = step5Saved as Partial<Step5Data> | null;
    const { newTotalInvestmentCents } = computeRenovationBreakdown(
      step5?.measures ?? [],
      purchasePriceCents + totalAncillaryCents
    );

    // 4. Financing (to get debt service)
    const step6 = step6Saved as Partial<Step6Data> | null;
    const { monthlyPaymentCents } = computeFinancingBreakdown(
      step6?.equity_cents ?? 0,
      newTotalInvestmentCents,
      step6?.loan_interest_rate_percent ?? 0,
      step6?.loan_repayment_rate_percent ?? 0
    );

    // 5. Operating Costs (to get owner burden)
    const step7 = step7Saved as Partial<Step7Data> | null;
    const { ownerCostsPerMonthCents } = computeOperatingCostsBreakdown(
      {
        recoverable_costs_per_month_cents: step7?.recoverable_costs_per_month_cents ?? 0,
        non_recoverable_costs_per_month_cents: step7?.non_recoverable_costs_per_month_cents ?? 0,
        property_management_fee_per_month_cents: step7?.property_management_fee_per_month_cents ?? 0,
        maintenance_reserve_per_month_cents: step7?.maintenance_reserve_per_month_cents ?? 0,
        additional_insurance_per_year_cents: step7?.additional_insurance_per_year_cents ?? 0,
        other_costs_per_year_cents: step7?.other_costs_per_year_cents ?? 0,
      },
      monthlyColdRentCents
    );

    return (
      <Step8Shell
        analysisId={id}
        monthlyColdRentCents={monthlyColdRentCents}
        ownerCostsPerMonthCents={ownerCostsPerMonthCents}
        monthlyPaymentCents={monthlyPaymentCents}
      />
    );
  }

  // ── Steps 9–16 — not yet implemented ─────────────────────────────────────
  notFound();
}
