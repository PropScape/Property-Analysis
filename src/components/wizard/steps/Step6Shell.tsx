"use client";

import { useState } from "react";
import { Step6Form, Step6FinancialHealthCard } from "./Step6Form";
import { KpiSidebarPlaceholder } from "@/components/wizard/KpiSidebarPlaceholder";
import type { Step6Data } from "@/domain/types/wizard";
import type { Step6ContextData } from "./Step6Form";
import { Building2 } from "lucide-react";

interface Step6ShellProps {
  analysisId: string;
  initialData?: Partial<Step6Data> | null;
  /** Total investment from steps 3 + 4 + 5 in integer cents. */
  totalInvestmentCents: number;
  /** Config default for the main loan interest rate */
  defaultInterestRate: number;
  /** Config default for the main loan repayment rate */
  defaultRepaymentRate: number;
  /** Config default for the main loan fixation period */
  defaultFixationYears: number;
}

/**
 * Step 6 shell — client component that owns shared live-summary state.
 *
 * @remarks
 * Follows the established Shell pattern: owns state, renders form + sidebar.
 * Form emits `onLiveChange`; shell passes live data to the Financial Health Card.
 *
 * See SPEC-WIZARD-STEP6 v1.0.0.
 */
export function Step6Shell({
  analysisId,
  initialData,
  totalInvestmentCents,
  defaultInterestRate,
  defaultRepaymentRate,
  defaultFixationYears,
}: Step6ShellProps) {
  // Initialize context data for the sidebar.
  // We use defaults or previously saved values.
  const [liveData, setLiveData] = useState<Step6ContextData>({
    equity_cents: initialData?.equity_cents ?? 0,
    loan_interest_rate_percent:
      initialData?.loan_interest_rate_percent ?? defaultInterestRate,
    loan_repayment_rate_percent:
      initialData?.loan_repayment_rate_percent ?? defaultRepaymentRate,
    totalInvestmentCents,
  });

  return (
    <div className="flex gap-8 items-start justify-center w-full">
      {/* Left sidebar — locked KPIs from earlier steps (placeholder) */}
      <aside className="hidden lg:flex flex-col gap-4 w-56 min-w-56 max-w-56 flex-shrink-0 opacity-50 sticky top-6">
        <KpiSidebarPlaceholder
          label="Gesamtinvestition"
          helperText="Aus Schritt 3, 4 & 5"
          icon={<span className="text-2xl font-bold text-slate-400">€</span>}
        />
      </aside>

      {/* Center: form */}
      <section className="flex-1 min-w-0 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Finanzierung
          </h1>
          <p className="text-slate-500 mt-2">
            Lege die Konditionen für dein Hauptdarlehen fest und berechne
            deine monatliche Belastung.
          </p>
        </div>
        <Step6Form
          analysisId={analysisId}
          initialData={initialData}
          totalInvestmentCents={totalInvestmentCents}
          onLiveChange={setLiveData}
          defaultInterestRate={defaultInterestRate}
          defaultRepaymentRate={defaultRepaymentRate}
          defaultFixationYears={defaultFixationYears}
        />
      </section>

      {/* Right sidebar: live financial health preview */}
      <aside className="hidden lg:flex flex-col gap-4 w-64 min-w-64 max-w-64 flex-shrink-0 sticky top-6 overflow-hidden">
        <Step6FinancialHealthCard data={liveData} />
        <KpiSidebarPlaceholder
          label="Nächster Schritt"
          helperText="Hausgeld & Verwaltung"
          icon={<Building2 className="w-10 h-10" />}
        />
      </aside>
    </div>
  );
}
