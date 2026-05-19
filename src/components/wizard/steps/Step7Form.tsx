"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HelpAccordion } from "@/components/wizard/HelpAccordion";
import { StepFooter } from "@/components/wizard/StepFooter";
import { ChartLine } from "lucide-react";
import { formatCentsEur } from "@/domain/calculations/currency";
import { computeOperatingCostsBreakdown } from "@/domain/calculations/operating-costs";
import { saveStepAction } from "@/actions/analysis";
import { useAnalysisStore } from "@/stores/analysis-store";
import type { Step7Data } from "@/domain/types/wizard";

/** Live context maintained by the shell. */
export interface Step7ContextData extends Step7Data {
  monthlyColdRentCents: number;
}

export interface Step7FormProps {
  analysisId: string;
  initialData?: Partial<Step7Data> | null;
  monthlyColdRentCents: number;
  onLiveChange: (data: Step7ContextData) => void;
  defaultRecoverable: number;
  defaultNonRecoverable: number;
  defaultManagement: number;
  defaultMaintenance: number;
  defaultInsurance: number;
  defaultOther: number;
}

/**
 * Step 7: Hausgeld & Verwaltung Form
 *
 * @remarks
 * Renders the input fields for operating costs and pushes live updates
 * to the Shell for the sidebar calculations.
 *
 * See SPEC-WIZARD-STEP7 v1.0.0.
 */
export function Step7Form({
  analysisId,
  initialData,
  monthlyColdRentCents,
  onLiveChange,
  defaultRecoverable,
  defaultNonRecoverable,
  defaultManagement,
  defaultMaintenance,
  defaultInsurance,
  defaultOther,
}: Step7FormProps) {
  const router = useRouter();
  const setStep7 = useAnalysisStore((state) => state.setStep7);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [recoverable, setRecoverable] = useState(
    initialData?.recoverable_costs_per_month_cents ?? defaultRecoverable
  );
  const [nonRecoverable, setNonRecoverable] = useState(
    initialData?.non_recoverable_costs_per_month_cents ?? defaultNonRecoverable
  );
  const [management, setManagement] = useState(
    initialData?.property_management_fee_per_month_cents ?? defaultManagement
  );
  const [maintenance, setMaintenance] = useState(
    initialData?.maintenance_reserve_per_month_cents ?? defaultMaintenance
  );
  const [insurance, setInsurance] = useState(
    initialData?.additional_insurance_per_year_cents ?? defaultInsurance
  );
  const [other, setOther] = useState(
    initialData?.other_costs_per_year_cents ?? defaultOther
  );

  const totalHausgeld = recoverable + nonRecoverable;

  useEffect(() => {
    onLiveChange({
      recoverable_costs_per_month_cents: recoverable,
      non_recoverable_costs_per_month_cents: nonRecoverable,
      property_management_fee_per_month_cents: management,
      maintenance_reserve_per_month_cents: maintenance,
      additional_insurance_per_year_cents: insurance,
      other_costs_per_year_cents: other,
      monthlyColdRentCents,
    });
  }, [
    recoverable,
    nonRecoverable,
    management,
    maintenance,
    insurance,
    other,
    monthlyColdRentCents,
    onLiveChange,
  ]);

  const handleSubmit = () => {
    setError(null);
    const payload: Step7Data = {
      recoverable_costs_per_month_cents: recoverable,
      non_recoverable_costs_per_month_cents: nonRecoverable,
      property_management_fee_per_month_cents: management,
      maintenance_reserve_per_month_cents: maintenance,
      additional_insurance_per_year_cents: insurance,
      other_costs_per_year_cents: other,
    };

    setStep7(payload);

    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 7,
        data: payload as unknown as Record<string, unknown>,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/analysis/${analysisId}/step/8`);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-8">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 sm:p-8 flex flex-col gap-8">
        
        {/* ── Hausgeld Split ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-900">
              Monatliches Hausgeld
            </label>
            <span className="text-xs font-medium text-slate-500">
              Gesamtkosten: {formatCentsEur(totalHausgeld)}
            </span>
          </div>
          
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Umlagefähig (auf Mieter)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={Math.round(recoverable / 100)}
                    onChange={(e) => setRecoverable(Number(e.target.value) * 100)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-semibold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">€</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Betriebskosten, Heizung, Wasser</p>
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Nicht umlagefähig (Eigentümer)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={Math.round(nonRecoverable / 100)}
                    onChange={(e) => setNonRecoverable(Number(e.target.value) * 100)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-semibold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">€</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Instandhaltung, Verwaltung</p>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />
        
        {/* ── Additional Monthly Costs ──────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Weitere monatliche Kosten
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Sondereigentumsverwaltung
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={Math.round(management / 100)}
                  onChange={(e) => setManagement(Number(e.target.value) * 100)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-medium"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-500">€</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Zusätzl. Instandhaltungsrücklage
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={Math.round(maintenance / 100)}
                  onChange={(e) => setMaintenance(Number(e.target.value) * 100)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-medium"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-500">€</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* ── Annual One-off Costs ──────────────────────────────────────── */}
        <div className="flex flex-col gap-6 relative">
          <div className="absolute inset-0 bg-slate-50/30 rounded-2xl -m-4 p-4 z-0 border border-slate-100"></div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Einmalige jährliche Kosten
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Zusätzliche Versicherungen
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={Math.round(insurance / 100)}
                    onChange={(e) => setInsurance(Number(e.target.value) * 100)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-500">€/Jahr</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Sonstige Nebenkosten (Puffer)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={Math.round(other / 100)}
                    onChange={(e) => setOther(Number(e.target.value) * 100)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-500">€/Jahr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <HelpAccordion triggerLabel="Warum trennen wir die Kosten auf?">
        <p className="text-sm text-slate-600 leading-relaxed">
          Nur die <strong>nicht umlagefähigen Kosten</strong> sowie Instandhaltung und Hausverwaltung schmälern deinen echten Gewinn. Die umlagefähigen Kosten zahlt dein Mieter mit der Warmmiete.
        </p>
      </HelpAccordion>

      {error && (
        <p role="alert" className="text-sm text-red-500 font-medium">
          {error}
        </p>
      )}

      <StepFooter
        showBack
        onBack={() => router.push(`/analysis/${analysisId}/step/6`)}
        isPending={isPending}
        primaryLabel="Weiter zu Initial Cashflow"
      />
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Financial Health Sidebar
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders the live Operating Costs Dashboard.
 */
export function Step7OperatingCostsCard({ data }: { data: Step7ContextData }) {
  const breakdown = computeOperatingCostsBreakdown(data, data.monthlyColdRentCents);
  
  // Calculate pin position for gauge. Min 0, Max 100.
  const costRatioPercent = Math.min(100, Math.max(0, breakdown.costRatioPercent));

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
        <ChartLine className="w-4 h-4 text-navy-500" /> Running Costs
      </h3>

      {/* Monthly Total */}
      <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
        <span className="text-xs font-medium text-slate-500 mb-1 text-center">
          Eigentümer-Kosten (mtl.)
        </span>
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatCentsEur(breakdown.ownerCostsPerMonthCents)}
        </span>
        <span className="text-xs text-slate-400 mt-1 text-center">
          Nicht umlagefähig + Zusatzkosten
        </span>
      </div>

      {/* Cost Ratio (Kostenquote) */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-700">Kostenquote (Kaltmiete)</span>
          <span className={`text-xs font-bold ${costRatioPercent > 35 ? 'text-rose-500' : costRatioPercent > 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {Math.round(costRatioPercent)}%
          </span>
        </div>
        
        {/* Gauge Bar */}
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500 w-[20%] shrink-0"></div>
          <div className="h-full bg-amber-400 w-[15%] shrink-0"></div>
          <div className="h-full bg-rose-500 w-[65%] shrink-0"></div>
        </div>
        {/* Render pin outside overflow hidden if we want to show it, or just rely on color changing. The mockup shows a pin. Let's do a simplified pin using a container below */}
        <div className="relative w-full h-3 -mt-2">
           <div 
              className="absolute top-0 w-1.5 h-3 bg-slate-900 rounded-full shadow-sm"
              style={{ left: `calc(${costRatioPercent}% - 3px)` }}
           ></div>
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>Gut (&lt; 20%)</span>
          <span>Hoch (&gt; 35%)</span>
        </div>
      </div>

      <hr className="border-slate-100 my-5" />

      {/* Annual Summary */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Laufende Kosten (p.a.)</span>
          <span className="font-semibold text-slate-900">
            {formatCentsEur(breakdown.annualRunningCostsCents).replace(' €', '')} €
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Einmalige Kosten (p.a.)</span>
          <span className="font-semibold text-slate-900">
            {formatCentsEur(breakdown.annualOneOffCostsCents).replace(' €', '')} €
          </span>
        </div>
        <div className="border-t border-dashed border-slate-300 my-1"></div>
        <div className="flex justify-between items-center text-sm font-bold">
          <span className="text-slate-900">Gesamtkosten (p.a.)</span>
          <span className="text-navy-600">
            {formatCentsEur(breakdown.totalAnnualCostsCents).replace(' €', '')} €
          </span>
        </div>
      </div>
    </div>
  );
}
