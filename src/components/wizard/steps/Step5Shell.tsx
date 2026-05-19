"use client";

import { useState } from "react";
import { Step5Form, Step5ImpactPreviewCard } from "./Step5Form";
import { KpiSidebarPlaceholder } from "@/components/wizard/KpiSidebarPlaceholder";
import type { Step5Data } from "@/domain/types/wizard";
import type { Step5LiveData } from "./Step5Form";
import { WIZARD_DEFAULTS } from "@/config/wizard-defaults";
import { Landmark } from "lucide-react";

interface Step5ShellProps {
  analysisId: string;
  initialData?: Partial<Step5Data> | null;
  /**
   * Total investment from steps 3 + 4 (purchase price + ancillary costs)
   * in integer cents. Used to compute the new Gesamtinvestition.
   */
  previousInvestmentCents: number;
}

/**
 * Step 5 shell — client component that owns shared live-summary state.
 *
 * @remarks
 * Follows the established Shell pattern: owns state, renders form + sidebar.
 * Form emits `onLiveDataChange`; shell passes live data to the Impact Preview Card.
 *
 * See SPEC-WIZARD-STEP5 v1.0.0.
 */
export function Step5Shell({
  analysisId,
  initialData,
  previousInvestmentCents,
}: Step5ShellProps) {
  const [liveData, setLiveData] = useState<Step5LiveData>({
    measures: initialData?.measures ?? [],
    previousInvestmentCents,
  });

  return (
    <div className="flex gap-8 items-start justify-center w-full">
      {/* Left sidebar — locked KPIs from earlier steps (placeholder) */}
      <aside className="hidden lg:flex flex-col gap-4 w-56 min-w-56 max-w-56 flex-shrink-0 opacity-50 sticky top-6">
        <KpiSidebarPlaceholder
          label="Bruttomietrendite"
          helperText="Aus Schritt 3 berechnet"
          icon={<span className="text-2xl font-bold text-slate-400">%</span>}
        />
        <KpiSidebarPlaceholder
          label="Gesamtinvestition"
          helperText="Aus Schritt 4 berechnet"
          icon={<span className="text-2xl font-bold text-slate-400">€</span>}
        />
      </aside>

      {/* Center: form */}
      <section className="flex-1 min-w-0 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Sanierungsmaßnahmen
          </h1>
          <p className="text-slate-500 mt-2">
            Erfasse geplante Modernisierungen und Instandhaltungen. Diese können
            sofort oder über Jahre verteilt anfallen.
          </p>
        </div>
        <Step5Form
          analysisId={analysisId}
          initialData={initialData}
          previousInvestmentCents={previousInvestmentCents}
          onLiveDataChange={setLiveData}
        />
      </section>

      {/* Right sidebar: live impact preview */}
      <aside className="hidden lg:flex flex-col gap-4 w-56 min-w-56 max-w-56 flex-shrink-0 sticky top-6 overflow-hidden">
        <Step5ImpactPreviewCard data={liveData} />
        <KpiSidebarPlaceholder
          label="Nächster Schritt"
          helperText="Eigenkapital und Hauptdarlehen festlegen"
          icon={<Landmark className="w-10 h-10" />}
        />
      </aside>
    </div>
  );
}
