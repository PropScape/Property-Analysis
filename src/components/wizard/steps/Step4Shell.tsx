"use client";

import { useState } from "react";
import { Step4Form, Step4InvestmentSummaryCard } from "./Step4Form";
import { KpiSidebarPlaceholder } from "@/components/wizard/KpiSidebarPlaceholder";
import { Hammer } from "lucide-react";
import type { Step4Data } from "@/domain/types/wizard";
import type { Step4LiveData } from "./Step4Form";

interface Step4ShellProps {
  analysisId: string;
  initialData?: Partial<Step4Data> | null;
  /** Purchase price from step 3 — needed to compute EUR amounts. */
  purchasePriceCents: number;
}

/**
 * Step 4 shell — Client Component that owns shared live-summary state.
 *
 * @remarks
 * Same pattern as Step3Shell: the form and the sidebar card both bind to
 * state held here so the receipt card updates on every keystroke.
 *
 * The page renders this shell; the shell renders the form + sidebar.
 */
export function Step4Shell({
  analysisId,
  initialData,
  purchasePriceCents,
}: Step4ShellProps) {
  const [liveData, setLiveData] = useState<Step4LiveData>({
    purchasePriceCents,
    brokerFeePercent: initialData?.broker_fee_percent ?? 3.57,
    notaryFeePercent: initialData?.notary_fee_percent ?? 1.5,
    landRegistryFeePercent: initialData?.land_registry_fee_percent ?? 0.5,
    bundesland: initialData?.bundesland ?? "NW",
    customItems: initialData?.custom_items ?? [],
  });

  return (
    <div className="flex gap-8 items-start justify-center w-full">
      {/* Left KPI sidebar — locked KPIs from earlier steps */}
      <aside className="hidden lg:flex flex-col gap-4 w-56 min-w-56 max-w-56 flex-shrink-0 opacity-50 sticky top-6">
        <KpiSidebarPlaceholder
          label="Bruttomietrendite"
          helperText="Aus Schritt 3 berechnet"
          icon={<span className="text-2xl font-bold text-slate-400">%</span>}
        />
        <KpiSidebarPlaceholder
          label="Kaufpreisfaktor"
          helperText="Aus Schritt 3 berechnet"
          icon={<span className="text-2xl font-bold text-slate-400">×</span>}
        />
      </aside>

      {/* Center: form */}
      <section className="flex-1 min-w-0 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kaufnebenkosten
          </h1>
          <p className="text-slate-500 mt-2">
            Erfasse die einmaligen Kosten, die beim Kauf der Immobilie
            anfallen. Diese erhöhen deinen Gesamtinvestitionsbedarf.
          </p>
        </div>
        <Step4Form
          analysisId={analysisId}
          initialData={initialData}
          purchasePriceCents={purchasePriceCents}
          onLiveDataChange={setLiveData}
        />
      </section>

      {/* Right sidebar: live investment summary */}
      <aside className="hidden lg:flex flex-col gap-4 w-56 min-w-56 max-w-56 flex-shrink-0 sticky top-6 overflow-hidden">
        <Step4InvestmentSummaryCard data={liveData} />
        <KpiSidebarPlaceholder
          label="Nächster Schritt"
          helperText="Sanierungsmaßnahmen planen"
          icon={<Hammer className="w-10 h-10" />}
        />
      </aside>
    </div>
  );
}
