"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, Scale, BarChart2, ShieldAlert } from "lucide-react";
import { formatCentsEur } from "@/domain/calculations/currency";
import { computeFinalCashflow, computeStressScenarios } from "@/domain/calculations/final-cashflow";
import { saveStepAction } from "@/actions/analysis";
import { useAnalysisStore } from "@/stores/analysis-store";
import { cn } from "@/lib/utils";
import type { FinalCashflowInputs } from "@/domain/types/wizard";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { WIZARD_DEFAULTS } from "@/config/wizard-defaults";

interface Step13ShellProps {
  analysisId: string;
  inputs: FinalCashflowInputs;
}

type TabId = "cashflow" | "rendite" | "stress";

export function Step13Shell({
  analysisId,
  inputs,
}: Step13ShellProps) {
  const router = useRouter();
  const setStep13 = useAnalysisStore((state) => state.setStep13);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("cashflow");

  const summary = computeFinalCashflow(inputs);
  const scenarios = computeStressScenarios(
    summary,
    inputs,
    WIZARD_DEFAULTS.defaultStressVacancyPercent,
    WIZARD_DEFAULTS.defaultStressInterestDeltaPp,
    WIZARD_DEFAULTS.defaultStressMaintenanceOnceCents
  );

  const isPositive = summary.afterTaxMonthCents > 0;
  const badgeColor = 
    summary.investmentStatus === "positiv" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
    summary.investmentStatus === "neutral" ? "bg-amber-50 border-amber-200 text-amber-700" :
    "bg-rose-50 border-rose-200 text-rose-700";

  const badgeText = 
    summary.investmentStatus === "positiv" ? "Investment Positiv" :
    summary.investmentStatus === "neutral" ? "Investment Neutral" :
    "Investment Negativ";

  const handleNext = () => {
    setError(null);
    setStep13({});

    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 13,
        data: {},
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/analysis/${analysisId}/step/14`);
    });
  };

  return (
    <div className="flex gap-8 items-start justify-center w-full min-h-[calc(100vh-16rem)]">
      
      {/* Left Column - Main Tabs */}
      <section className="flex-1 min-w-0 max-w-3xl flex flex-col gap-6">
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Finale Auswertung
            </h1>
            <div className={cn("px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider", badgeColor)}>
              {badgeText}
            </div>
          </div>
          <p className="text-slate-500 text-base">
            Deine Cashflow-Berechnung inklusive Steuereffekten und 10-Jahres-Prognose.
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="flex p-1 bg-slate-100/80 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab("cashflow")}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold rounded-lg transition-all",
              activeTab === "cashflow" ? "bg-white text-navy-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Cashflow & Steuern
          </button>
          <button
            onClick={() => setActiveTab("rendite")}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold rounded-lg transition-all",
              activeTab === "rendite" ? "bg-white text-navy-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Eigenkapital & Rendite
          </button>
          <button
            onClick={() => setActiveTab("stress")}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold rounded-lg transition-all",
              activeTab === "stress" ? "bg-white text-navy-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Stresstest Highlights
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
          
          {/* TAB: Cashflow & Steuern */}
          {activeTab === "cashflow" && (
            <div className="p-6 sm:p-8 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Cashflow nach Steuern
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider block mb-1">Vor Steuern (mtl.)</span>
                <span className="text-3xl font-bold text-slate-900">
                  {summary.preTaxMonthCents >= 0 ? "+" : "-"}{formatCentsEur(Math.abs(summary.preTaxMonthCents))}
                </span>
              </div>
              <div className={cn(
                "rounded-2xl p-5 border",
                isPositive ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
              )}>
                <span className={cn(
                  "text-sm font-semibold uppercase tracking-wider block mb-1",
                  isPositive ? "text-emerald-700" : "text-rose-700"
                )}>Nach Steuern (mtl.)</span>
                <span className={cn(
                  "text-3xl font-bold",
                  isPositive ? "text-emerald-600" : "text-rose-600"
                )}>
                  {summary.afterTaxMonthCents >= 0 ? "+" : "-"}{formatCentsEur(Math.abs(summary.afterTaxMonthCents))}
                </span>
              </div>
            </div>

            <div className="bg-navy-50 rounded-2xl p-5 border border-navy-100 flex items-start gap-4 mb-8">
              <div className="bg-white p-2 rounded-lg text-navy-600 shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-navy-900 mb-1">Steuervorteil (Erstattung)</h3>
                <p className="text-sm text-navy-700">
                  Durch Abschreibungen (AfA) und Zinsabzugsfähigkeit entsteht ein rechnerischer steuerlicher Verlust. Dieser führt zu einer voraussichtlichen jährlichen Steuererstattung von <strong className="font-bold">{formatCentsEur(summary.taxRefundAnnualCents)}</strong>, die deinen Cashflow optimiert.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Cashflow Entwicklung (10 Jahre)</h3>
              <div className="h-[300px] w-full bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={summary.projectionYears} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="year" 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      tickFormatter={(val) => `J${val}`}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      width={80}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(val) => `${Math.round(val / 100).toLocaleString('de-DE')} €`}
                    />
                    <Tooltip 
                      formatter={(value: unknown, name: string) => {
                        const label = name === "afterTaxCents" ? "Nach Steuern" : "Vor Steuern";
                        return [formatCentsEur(Number(value)), label];
                      }}
                      labelFormatter={(label) => `Jahr ${label}`}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="plainline"
                      formatter={(value) => (
                        <span className="text-slate-500 text-sm font-medium ml-1">
                          {value === "afterTaxCents" ? "Nach Steuern" : "Vor Steuern"}
                        </span>
                      )}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="afterTaxCents" 
                      name="afterTaxCents"
                      stroke="#1e3a8a" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCashflow)" 
                      activeDot={{ r: 6, fill: "#1e3a8a", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="preTaxCents"
                      name="preTaxCents"
                      stroke="#64748b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#64748b" }}
                      activeDot={{ r: 6, fill: "#64748b", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          )}

          {/* TAB: Eigenkapital & Rendite */}
          {activeTab === "rendite" && (
            <div className="p-6 sm:p-8 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Scale className="w-5 h-5 text-navy-500" />
              Rendite & Vermögensaufbau
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Eingesetztes EK</span>
                <span className="text-2xl font-bold text-slate-900">{formatCentsEur(summary.equityRequiredCents)}</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Bruttomietrendite</span>
                <span className="text-2xl font-bold text-slate-900">{summary.grossYieldPercent.toFixed(1)} %</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">ROE (Jahr 1)</span>
                <span className="text-2xl font-bold text-slate-900">{summary.roePercent.toFixed(1)} %</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Total Return (Jahr 1)</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Netto-Cashflow (nach Steuern)</span>
                <span className="font-semibold text-slate-900">{summary.afterTaxAnnualCents >= 0 ? "+" : "-"}{formatCentsEur(Math.abs(summary.afterTaxAnnualCents))}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Tilgung (Vermögensaufbau)</span>
                <span className="font-semibold text-emerald-600">+{formatCentsEur(summary.annualRepaymentCents)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Wertsteigerung ({inputs.appreciationRatePercent} % p.a.)</span>
                <span className="font-semibold text-emerald-600">+{formatCentsEur(summary.appreciationAnnualCents)}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="font-bold text-slate-900">Total Return p.a.</span>
                <span className="text-xl font-bold text-navy-600">{formatCentsEur(summary.totalReturnYear1Cents)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Der Total Return berücksichtigt neben dem Cashflow auch den langfristigen Vermögensaufbau durch Schuldentilgung und konservativ geschätzte Wertsteigerung.
            </p>
          </div>
          )}

          {/* TAB: Stresstest Highlights */}
          {activeTab === "stress" && (
            <div className="p-6 sm:p-8 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Szenario-Analyse
            </h2>

            <div className="space-y-4">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{scenario.title}</h3>
                    <p className="text-sm text-slate-500">{scenario.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn(
                      "block text-lg font-bold mb-1",
                      scenario.status === "ok" ? "text-emerald-600" :
                      scenario.status === "risk" ? "text-amber-500" : "text-rose-600"
                    )}>
                      {scenario.cashflowMonthCents >= 0 ? "+" : "-"}{formatCentsEur(Math.abs(scenario.cashflowMonthCents))}
                    </span>
                    <span className={cn(
                      "text-xs font-semibold uppercase px-2 py-1 rounded-md",
                      scenario.status === "ok" ? "bg-emerald-50 text-emerald-700" :
                      scenario.status === "risk" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {scenario.status === "ok" ? "Sicher" : scenario.status === "risk" ? "Kritisch (Risiko)" : "Defizitär"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-500 font-medium">
            {error}
          </p>
        )}

        <div className="w-full flex items-center justify-between mt-4">
          <button 
            onClick={() => router.push(`/analysis/${analysisId}/step/12`)}
            disabled={isPending}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Nuancen
          </button>
          <button 
            onClick={handleNext}
            disabled={isPending}
            className="px-8 py-3 bg-navy-600 hover:bg-navy-700 text-white rounded-xl font-semibold shadow-[0_4px_14px_0_rgba(30,58,138,0.39)] hover:shadow-[0_6px_20px_rgba(30,58,138,0.23)] transition-all flex items-center gap-2 group disabled:opacity-50"
          >
            Weiter zur Gesamtübersicht
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Right Column - Expert Dashboard Teaser */}
      <aside className="hidden lg:flex flex-col gap-4 w-80 flex-shrink-0 sticky top-6">
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-navy-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
          
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 relative z-10 border border-white/10">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2 relative z-10">Expert Dashboard</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">
            Im nächsten Schritt fassen wir alle Kennzahlen in einem interaktiven Dashboard zusammen. Hier kannst du letzte Parameter feinjustieren und den Export vorbereiten.
          </p>
          
          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              Live-Sensitivitätsanalyse
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              Banken-Exposé PDF-Export
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              Zins/Tilgung-Schieberegler
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}
