"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, TrendingUp, PenSquare, Home, Wrench, Building2, Pen } from "lucide-react";
import { formatCentsEur } from "@/domain/calculations/currency";
import { computeInitialCashflow } from "@/domain/calculations/cashflow";
import { saveStepAction } from "@/actions/analysis";
import { useAnalysisStore } from "@/stores/analysis-store";
import { cn } from "@/lib/utils";

interface Step8ShellProps {
  analysisId: string;
  monthlyColdRentCents: number;
  ownerCostsPerMonthCents: number;
  monthlyPaymentCents: number;
}

/**
 * Step 8 shell — Initial Cashflow Dashboard.
 *
 * @remarks
 * A pure dashboard step that visualizes the pre-tax cashflow.
 * It contains no inputs, but allows navigating back to previous steps
 * to edit assumptions via the breakdown table.
 *
 * See SPEC-WIZARD-STEP8 v1.0.0.
 */
export function Step8Shell({
  analysisId,
  monthlyColdRentCents,
  ownerCostsPerMonthCents,
  monthlyPaymentCents,
}: Step8ShellProps) {
  const router = useRouter();
  const setStep8 = useAnalysisStore((state) => state.setStep8);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { monthlyCashflowCents, isPositive } = computeInitialCashflow(
    monthlyColdRentCents,
    ownerCostsPerMonthCents,
    monthlyPaymentCents
  );

  const handleNext = () => {
    setError(null);
    setStep8({}); // Save empty payload

    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 8,
        data: {},
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      // TODO: navigate to Step 9 once implemented
      router.push(`/analysis/${analysisId}/step/9`);
    });
  };

  return (
    <div className="flex flex-col gap-8 items-center justify-center w-full max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="w-full flex flex-col items-center text-center max-w-3xl mx-auto mb-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Initial Monthly Cashflow
        </h1>
        <p className="text-slate-500 mt-3 text-base">
          Dein vorläufiger Cashflow vor Steuern. Überprüfe die Zusammensetzung und passe bei Bedarf die Annahmen an.
        </p>
      </div>

      {/* KPI Hero Section */}
      <section className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br to-transparent opacity-50",
          isPositive ? "from-emerald-50" : "from-rose-50"
        )}></div>
        
        <div className="relative p-8 sm:p-12 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
            Cashflow vor Steuern (mtl.)
          </span>
          
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-7xl font-bold text-slate-900 tracking-tighter">
              {monthlyCashflowCents >= 0 ? "+" : "-"} {formatCentsEur(Math.abs(monthlyCashflowCents)).replace(' €', '')}
            </span>
            <span className="text-2xl sm:text-3xl font-semibold text-slate-500">€</span>
          </div>
          
          <div className={cn(
            "mt-6 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
            isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}>
            <TrendingUp className="w-4 h-4" />
            {isPositive ? 'Positiver Cashflow' : 'Negativer Cashflow'}
          </div>
        </div>
      </section>

      {/* Detailed Breakdown Table */}
      <section className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Zusammensetzung Cashflow</h2>
          <button 
            onClick={() => router.push(`/analysis/${analysisId}/step/3`)}
            className="text-sm text-navy-600 font-medium hover:text-navy-700 flex items-center gap-1.5 transition-colors"
          >
            <PenSquare className="w-4 h-4" /> Annahmen anpassen
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategorie</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Betrag (mtl.)</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-20">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* Rent Income (Step 3) */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Kaltmiete</p>
                      <p className="text-xs text-slate-500">Mieteinnahmen (Schritt 3)</p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6 text-right">
                  <span className="text-base font-bold text-emerald-600">+ {formatCentsEur(monthlyColdRentCents)}</span>
                </td>
                <td className="py-5 px-6 text-center">
                  <button 
                    onClick={() => router.push(`/analysis/${analysisId}/step/3`)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors flex items-center justify-center mx-auto"
                    aria-label="Kaltmiete bearbeiten"
                  >
                    <Pen className="w-4 h-4" />
                  </button>
                </td>
              </tr>
              
              {/* Operating Costs (Step 7) */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Eigentümer-Kosten</p>
                      <p className="text-xs text-slate-500">Hausgeld & Instandhaltung (Schritt 7)</p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6 text-right">
                  <span className="text-base font-semibold text-slate-700">- {formatCentsEur(ownerCostsPerMonthCents)}</span>
                </td>
                <td className="py-5 px-6 text-center">
                  <button 
                    onClick={() => router.push(`/analysis/${analysisId}/step/7`)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors flex items-center justify-center mx-auto"
                    aria-label="Eigentümer-Kosten bearbeiten"
                  >
                    <Pen className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              {/* Financing (Step 6) */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Kapitaldienst</p>
                      <p className="text-xs text-slate-500">Zins & Tilgung (Schritt 6)</p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6 text-right">
                  <span className="text-base font-semibold text-slate-700">- {formatCentsEur(monthlyPaymentCents)}</span>
                </td>
                <td className="py-5 px-6 text-center">
                  <button 
                    onClick={() => router.push(`/analysis/${analysisId}/step/6`)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors flex items-center justify-center mx-auto"
                    aria-label="Kapitaldienst bearbeiten"
                  >
                    <Pen className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="py-5 px-6 font-bold text-slate-900">Ergebnis (vor Steuern)</td>
                <td className={cn(
                  "py-5 px-6 text-right text-lg font-bold",
                  isPositive ? "text-emerald-600" : "text-slate-900"
                )}>
                  {monthlyCashflowCents >= 0 ? "+" : "-"} {formatCentsEur(Math.abs(monthlyCashflowCents))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-red-500 font-medium">
          {error}
        </p>
      )}

      {/* Desktop Actions */}
      <div className="w-full flex items-center justify-between">
        <button 
          onClick={() => router.push(`/analysis/${analysisId}/step/7`)}
          disabled={isPending}
          className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zu Hausgeld
        </button>
        <button 
          onClick={handleNext}
          disabled={isPending}
          className="px-8 py-3 bg-navy-600 hover:bg-navy-700 text-white rounded-xl font-semibold shadow-[0_4px_14px_0_rgba(30,58,138,0.39)] hover:shadow-[0_6px_20px_rgba(30,58,138,0.23)] transition-all flex items-center gap-2 group disabled:opacity-50"
        >
          Weiter zu Zinsrisiko
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
}
