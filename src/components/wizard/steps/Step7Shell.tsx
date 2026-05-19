"use client";

import { useState } from "react";
import { Step7Form, Step7OperatingCostsCard } from "./Step7Form";
import { KpiSidebarPlaceholder } from "@/components/wizard/KpiSidebarPlaceholder";
import type { Step7Data } from "@/domain/types/wizard";
import type { Step7ContextData } from "./Step7Form";
import { Wallet } from "lucide-react";

interface Step7ShellProps {
  analysisId: string;
  initialData?: Partial<Step7Data> | null;
  /** Cold rent from Step 3 for the cost ratio calculation */
  monthlyColdRentCents: number;
  
  // Defaults
  defaultRecoverable: number;
  defaultNonRecoverable: number;
  defaultManagement: number;
  defaultMaintenance: number;
  defaultInsurance: number;
  defaultOther: number;
}

/**
 * Step 7 shell — client component that owns shared live-summary state.
 *
 * @remarks
 * Follows the established Shell pattern: owns state, renders form + sidebar.
 * Form emits `onLiveChange`; shell passes live data to the Operating Costs Card.
 *
 * See SPEC-WIZARD-STEP7 v1.0.0.
 */
export function Step7Shell({
  analysisId,
  initialData,
  monthlyColdRentCents,
  defaultRecoverable,
  defaultNonRecoverable,
  defaultManagement,
  defaultMaintenance,
  defaultInsurance,
  defaultOther,
}: Step7ShellProps) {
  // Initialize context data for the sidebar.
  const [liveData, setLiveData] = useState<Step7ContextData>({
    recoverable_costs_per_month_cents:
      initialData?.recoverable_costs_per_month_cents ?? defaultRecoverable,
    non_recoverable_costs_per_month_cents:
      initialData?.non_recoverable_costs_per_month_cents ?? defaultNonRecoverable,
    property_management_fee_per_month_cents:
      initialData?.property_management_fee_per_month_cents ?? defaultManagement,
    maintenance_reserve_per_month_cents:
      initialData?.maintenance_reserve_per_month_cents ?? defaultMaintenance,
    additional_insurance_per_year_cents:
      initialData?.additional_insurance_per_year_cents ?? defaultInsurance,
    other_costs_per_year_cents:
      initialData?.other_costs_per_year_cents ?? defaultOther,
    monthlyColdRentCents,
  });

  return (
    <div className="flex gap-8 items-start justify-center w-full">
      {/* Left sidebar — locked KPIs from earlier steps (placeholder) */}
      <aside className="hidden lg:flex flex-col gap-4 w-56 min-w-56 max-w-56 flex-shrink-0 opacity-50 sticky top-6">
        <KpiSidebarPlaceholder
          label="Mieteinnahmen"
          helperText="Aus Schritt 3"
          icon={<span className="text-2xl font-bold text-slate-400">€</span>}
        />
      </aside>

      {/* Center: form */}
      <section className="flex-1 min-w-0 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Hausgeld & Betriebskosten
          </h1>
          <p className="text-slate-500 mt-2">
            Erfasse alle laufenden Kosten, um die monatliche Belastung und die Kostenquote zu berechnen.
          </p>
        </div>
        <Step7Form
          analysisId={analysisId}
          initialData={initialData}
          monthlyColdRentCents={monthlyColdRentCents}
          onLiveChange={setLiveData}
          defaultRecoverable={defaultRecoverable}
          defaultNonRecoverable={defaultNonRecoverable}
          defaultManagement={defaultManagement}
          defaultMaintenance={defaultMaintenance}
          defaultInsurance={defaultInsurance}
          defaultOther={defaultOther}
        />
      </section>

      {/* Right sidebar: live operating costs dashboard */}
      <aside className="hidden lg:flex flex-col gap-4 w-64 min-w-64 max-w-64 flex-shrink-0 sticky top-6 overflow-hidden">
        <Step7OperatingCostsCard data={liveData} />
        <KpiSidebarPlaceholder
          label="Nächster Schritt"
          helperText="Initial Cashflow"
          icon={<Wallet className="w-10 h-10" />}
        />
      </aside>
    </div>
  );
}
