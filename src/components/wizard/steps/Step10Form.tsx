"use client";

import { useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAnalysisStore } from "@/stores/analysis-store";
import { saveStepAction } from "@/actions/analysis";
import { StepFooter } from "@/components/wizard/StepFooter";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, AreaChart as AreaChartIcon, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeEffectiveTaxRate } from "@/domain/calculations/tax-kpis";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface Step10FormProps {
  analysisId: string;
  preTaxCashflowCents: number;
  churchTaxRatePercent: number;
}

export function Step10Form({
  analysisId,
  preTaxCashflowCents,
  churchTaxRatePercent,
}: Step10FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const data = useAnalysisStore((state) => state.step10);
  const updateData = useAnalysisStore((state) => state.setStep10);

  const legalEntity = data.legal_entity ?? "privat";
  const marginalTaxRate = data.marginal_tax_rate_percent ?? 42;
  const hasSoli = data.has_soli ?? true;
  const hasChurchTax = data.has_church_tax ?? false;
  const notes = data.notes ?? "";

  const isPrivat = legalEntity === "privat";

  const effectiveTaxRate = computeEffectiveTaxRate(
    legalEntity,
    marginalTaxRate,
    hasSoli,
    hasChurchTax,
    churchTaxRatePercent
  );

  /**
   * After-tax estimate for the sidebar preview.
   *
   * @remarks
   * A precise after-tax figure requires AfA (Step 11), deductible interest,
   * and special deductions (Step 12) — none of which are available yet.
   * We apply the effective rate directly to the pre-tax cashflow as a
   * conservative worst-case approximation. The final result will differ
   * once all deductions are factored in.
   */
  const preTaxEur = preTaxCashflowCents / 100;
  const taxAmount = preTaxEur * (effectiveTaxRate / 100);
  const afterTaxEur = preTaxEur - taxAmount;

  // Chart Data: Cashflow vs. Tax Rate Curve (privat only; fixed for GmbH/gewerblich)
  // X-axis range mirrors the input cap: 0–45% (Spitzensteuersatz / Reichensteuer).
  const chartData = useMemo(() => {
    const points = [0, 10, 20, 30, 40, 42, 45];
    return points.map((x) => {
      const simEffective = computeEffectiveTaxRate(
        legalEntity,
        x,
        hasSoli,
        hasChurchTax,
        churchTaxRatePercent
      );
      // For GmbH/gewerblich the rate is fixed regardless of the slider value.
      const plotRate = isPrivat ? simEffective : effectiveTaxRate;
      const simAfterTax = Math.round(preTaxCashflowCents / 100 - (preTaxCashflowCents / 100) * (plotRate / 100));
      return {
        rate: x,
        cashflow: simAfterTax,
      };
    });
    // `preTaxCashflowCents` is a stable prop (number primitive) — safe as a dep.
    // Derived `preTaxEur` / `taxablePortion` are excluded because they are always
    // new references that would defeat memoisation.
  }, [legalEntity, hasSoli, hasChurchTax, churchTaxRatePercent, preTaxCashflowCents, isPrivat, effectiveTaxRate]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 10,
        data: {
          legal_entity: legalEntity,
          marginal_tax_rate_percent: marginalTaxRate,
          has_soli: hasSoli,
          has_church_tax: hasChurchTax,
          notes: notes || undefined,
        }
      });

      if (result.success) {
        router.push(`/analysis/${analysisId}/step/11`);
      } else {
        alert((typeof result.error === "object" && result.error !== null) ? (result.error as Record<string, string[]>)?._form?.[0] : result.error || "Fehler beim Speichern");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 w-full max-w-[1440px] mx-auto">
      
      {/* Left Column: Inputs */}
      <div className="w-full lg:w-7/12 flex flex-col gap-6">
        <div className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">Persönliche Steuerannahmen</h1>
          <p className="text-slate-500 text-base leading-relaxed">
            Bitte gib deine individuellen steuerlichen Parameter ein, um den genauen Netto-Cashflow nach Steuern zu berechnen.
          </p>
        </div>

        {/* Tax Assumptions Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          
          <div className="mb-8">
            <Label className="block text-sm font-semibold text-slate-700 mb-2">Steuerliche Veranlagung (Rechtsform)</Label>
            <Select 
              value={legalEntity} 
              onValueChange={(val: "privat" | "gmbh" | "gewerblich" | null) => {
                if (val) updateData({ legal_entity: val });
              }}
            >
              <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-navy-500">
                <SelectValue placeholder="Rechtsform wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="privat">Privatperson (Einkommensteuer)</SelectItem>
                <SelectItem value="gmbh">Vermögensverwaltende GmbH</SelectItem>
                <SelectItem value="gewerblich">Gewerblicher Grundstückshandel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={cn("mb-8 transition-opacity", !isPrivat && "opacity-50 pointer-events-none")}>
            <div className="flex items-center justify-between mb-4">
              <Label className="block text-sm font-semibold text-slate-700">Persönlicher Grenzsteuersatz</Label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 flex items-center gap-1 focus-within:border-navy-500 focus-within:ring-1 focus-within:ring-navy-500">
                <input 
                  type="number" 
                  value={marginalTaxRate} 
                  onChange={(e) => updateData({ marginal_tax_rate_percent: Number(e.target.value) })}
                  className="w-12 bg-transparent text-right font-bold text-slate-900 focus:outline-none" 
                  min="0" 
                  max="45"
                  disabled={!isPrivat}
                />
                <span className="text-slate-500 font-medium">%</span>
              </div>
            </div>
            
            <div className="relative pt-2 pb-2">
              <input 
                type="range" 
                min="0" 
                max="45" 
                step="1" 
                value={marginalTaxRate}
                onChange={(e) => updateData({ marginal_tax_rate_percent: Number(e.target.value) })}
                className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-slate-200 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-navy-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                disabled={!isPrivat}
              />
              <div 
                className="absolute top-3.5 left-0 h-1.5 bg-navy-600 rounded-l-full pointer-events-none" 
                style={{ width: `${(marginalTaxRate / 45) * 100}%` }}
              ></div>
              <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                <span>0%</span>
                <span>15%</span>
                <span>30%</span>
                <span>45%</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span>Der Spitzensteuersatz liegt in Deutschland bei 42%, ab ca. 277.826 € (Ledige) greift die Reichensteuer (45%).</span>
            </p>
          </div>

          <div className="h-[1px] w-full bg-slate-100 my-6"></div>

          <div className={cn("space-y-6 transition-opacity", !isPrivat && "opacity-50 pointer-events-none")}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-700">Solidaritätszuschlag</h4>
                <p className="text-xs text-slate-500 mt-1">5,5% auf die Einkommensteuer</p>
              </div>
              <Switch 
                checked={hasSoli} 
                onCheckedChange={(val: boolean) => updateData({ has_soli: val })} 
                disabled={!isPrivat}
                className="data-[state=checked]:bg-navy-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-700">Kirchensteuer</h4>
                <p className="text-xs text-slate-500 mt-1">Automatisch ({churchTaxRatePercent}%) anhand Bundesland</p>
              </div>
              <Switch 
                checked={hasChurchTax} 
                onCheckedChange={(val: boolean) => updateData({ has_church_tax: val })}
                disabled={!isPrivat}
                className="data-[state=checked]:bg-navy-600"
              />
            </div>
          </div>
        </div>

        {/* Other Income Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-6">
          <Label className="block text-sm font-semibold text-slate-700 mb-2">Weitere Einkünfte & Notizen (Optional)</Label>
          <p className="text-xs text-slate-500 mb-4">Erfasse hier Besonderheiten wie Verlustvorträge oder andere Einkunftsarten, die deine Steuerlast beeinflussen könnten.</p>
          <Textarea 
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateData({ notes: e.target.value })}
            className="w-full bg-slate-50 border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-navy-500 min-h-[100px] resize-none"
            placeholder="Z.B. Vorhandener Verlustvortrag aus Vorjahren: 15.000 €..."
          />
        </div>

        <StepFooter
          onBack={() => router.push(`/analysis/${analysisId}/step/9`)}
          isPending={isPending}
          primaryLabel="Weiter zur AfA"
        />
      </div>

      {/* Right Column: Live Impact Preview */}
      <div className="w-full lg:w-5/12 flex flex-col">
        <div className="sticky top-24 flex flex-col gap-6">
          
          {/* KPI Summary Widget */}
          <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-1 relative overflow-hidden">
            {/* Decorative Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-navy-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
            
            <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-navy-400 flex items-center justify-center">
                  <AreaChartIcon className="w-4 h-4" />
                </div>
                <h3 className="text-white font-semibold">Live Impact Preview</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1">Pre-Tax Cashflow</span>
                  <span className="text-white text-xl font-bold">{Math.round(preTaxEur)} € <span className="text-slate-500 text-sm font-normal">/ mtl.</span></span>
                </div>
                <div className="bg-slate-900/80 rounded-xl p-4 border border-navy-500/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-navy-500"></div>
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1">After-Tax Cashflow</span>
                  <span className="text-white text-xl font-bold">{Math.round(afterTaxEur)} € <span className="text-slate-500 text-sm font-normal">/ mtl.</span></span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Effektive Steuerlast (geschätzt)</span>
                  <span className="text-navy-400 font-semibold">{effectiveTaxRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-navy-600 to-navy-400 transition-all duration-300" style={{ width: `${Math.min(effectiveTaxRate, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Chart Container */}
            <div className="bg-slate-900 p-4 rounded-b-xl relative z-10 border-t border-slate-800 h-[220px]">
              <p className="text-xs text-slate-400 mb-2 ml-2 font-medium">Cashflow vs. Tax Rate Curve</p>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="rate" 
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(val) => `${val}%`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(val) => `${val}€`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }}
                    itemStyle={{ color: "#f8fafc" }}
                    labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
                    formatter={(value: number) => [`${value} €`, "Cashflow"]}
                    labelFormatter={(label) => `Grenzsteuersatz: ${label}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="cashflow"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCashflow)"
                    activeDot={{ r: 6, fill: "#fff", stroke: "#3b82f6", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 flex items-start gap-4">
            <Lightbulb className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 leading-relaxed">
              Die genaue Steuerberechnung erfolgt unter Berücksichtigung der Gebäudeabschreibung (AfA) und der abzugsfähigen Zinsen im nächsten Schritt. Diese Vorschau zeigt den isolierten Effekt deines Steuersatzes auf den steuerpflichtigen Überschuss.
            </p>
          </div>

        </div>
      </div>
    </form>
  );
}
