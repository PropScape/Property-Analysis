"use client";

import { useTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysisStore } from "@/stores/analysis-store";
import { saveStepAction } from "@/actions/analysis";
import { StepFooter } from "@/components/wizard/StepFooter";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, TrendingDown, PiggyBank, Calculator, ChevronDown, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCentsEur } from "@/domain/calculations/currency";
import {
  computeAfaBasis,
  computeAnnualDepreciation,
  computeTaxShield,
} from "@/domain/calculations/tax-kpis";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Step11FormProps {
  analysisId: string;
  /** Purchase price from Step 3, in cents. */
  purchasePriceCents: number;
  /** Ancillary costs from Step 4, in cents. */
  ancillaryCostsCents: number;
  /** Total renovation costs from Step 5, in cents. */
  renovationCostsCents: number;
  /** Effective tax rate from Step 10, as a percentage. */
  effectiveTaxRatePercent: number;
}

export function Step11Form({
  analysisId,
  purchasePriceCents,
  ancillaryCostsCents,
  renovationCostsCents,
  effectiveTaxRatePercent,
}: Step11FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isHelperOpen, setIsHelperOpen] = useState(false);

  const data = useAnalysisStore((state) => state.step11);
  const updateData = useAnalysisStore((state) => state.setStep11);

  const buildingSharePercent = data.building_share_percent ?? 80;
  const afaMethod = data.afa_method ?? "linear";
  const afaRatePercent = data.afa_rate_percent ?? 2.0;
  const afaStartDate = data.afa_start_date ?? "";

  // Computed values
  const totalAcquisitionCents = purchasePriceCents + ancillaryCostsCents;
  const buildingValueCents = Math.round(totalAcquisitionCents * (buildingSharePercent / 100));
  const landValueCents = totalAcquisitionCents - buildingValueCents;

  const afaBasisCents = computeAfaBasis(
    purchasePriceCents,
    ancillaryCostsCents,
    renovationCostsCents,
    buildingSharePercent
  );
  const annualDepreciationCents = computeAnnualDepreciation(afaBasisCents, afaRatePercent);
  const taxShieldCents = computeTaxShield(annualDepreciationCents, effectiveTaxRatePercent);

  // Donut chart data for the helper
  const donutData = useMemo(() => [
    { name: "Gebäude", value: buildingSharePercent },
    { name: "Grund & Boden", value: 100 - buildingSharePercent },
  ], [buildingSharePercent]);

  const DONUT_COLORS = ["#1e3a8a", "#94a3b8"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 11,
        data: {
          building_share_percent: buildingSharePercent,
          afa_method: afaMethod,
          afa_rate_percent: afaRatePercent,
          afa_start_date: afaStartDate,
        },
      });

      if (result.success) {
        router.push(`/analysis/${analysisId}/step/12`);
      } else {
        alert(
          typeof result.error === "object" && result.error !== null
            ? (result.error as Record<string, string[]>)?._form?.[0]
            : result.error || "Fehler beim Speichern"
        );
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col lg:flex-row gap-8 w-full max-w-[1440px] mx-auto"
    >
      {/* Left Column: Input Forms */}
      <div className="w-full lg:w-7/12 flex flex-col gap-6">
        <div className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Gebäudeabschreibung (AfA)
          </h1>
          <p className="text-slate-500 text-base leading-relaxed">
            Ermittle den Gebäudeanteil und lege die Abschreibungsparameter fest,
            um deine steuerlichen Vorteile zu berechnen.
          </p>
        </div>

        {/* Building vs Land Share Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Aufteilung Kaufpreis
          </h3>

          {/* Slider Section */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <div>
                <Label className="block text-sm font-semibold text-slate-700">
                  Gebäudeanteil
                </Label>
                <p className="text-xs text-slate-500">Abschreibungsfähig</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 flex items-center gap-1 focus-within:border-navy-500 focus-within:ring-1 focus-within:ring-navy-500">
                <input
                  type="number"
                  value={buildingSharePercent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    let val = Number(e.target.value);
                    if (val < 0) val = 0;
                    if (val > 100) val = 100;
                    updateData({ building_share_percent: val });
                  }}
                  className="w-12 bg-transparent text-right font-bold text-slate-900 focus:outline-none"
                  min="0"
                  max="100"
                />
                <span className="text-slate-500 font-medium">%</span>
              </div>
            </div>

            {/* Visual Split Bar */}
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex mb-4">
              <div
                className="h-full bg-navy-600 transition-all duration-300"
                style={{ width: `${buildingSharePercent}%` }}
              />
              <div
                className="h-full bg-slate-400 transition-all duration-300"
                style={{ width: `${100 - buildingSharePercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-navy-600">
                {formatCentsEur(buildingValueCents)}
              </span>
              <div className="text-right">
                <Label className="block text-sm font-semibold text-slate-700">
                  Grund und Boden
                </Label>
                <p className="text-xs text-slate-500 mb-1">
                  Nicht abschreibungsfähig
                </p>
                <span className="text-sm font-medium text-slate-600">
                  {formatCentsEur(landValueCents)}
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="relative pt-6 pb-2">
              <input
                type="range"
                min="0"
                max="100"
                value={buildingSharePercent}
                step="1"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData({ building_share_percent: Number(e.target.value) })
                }
                className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-slate-200 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-navy-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
              />
              <div
                className="absolute top-7.5 left-0 h-1.5 bg-navy-600 rounded-l-full pointer-events-none"
                style={{ width: `${buildingSharePercent}%` }}
              />
            </div>
          </div>

          {/* Helper Accordion (Dummy) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-2">
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none group"
              onClick={() => setIsHelperOpen(!isHelperOpen)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-50 text-navy-600 flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-slate-800">
                    Kaufpreisaufteilungs-Helfer
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Ermittle den exakten Gebäudeanteil nach BMF-Schema
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 group-hover:border-slate-300 transition-all">
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    isHelperOpen && "rotate-180"
                  )}
                />
              </div>
            </button>

            {isHelperOpen && (
              <div className="border-t border-slate-200 bg-white">
                <div className="p-6 flex flex-col xl:flex-row gap-8">
                  {/* Left: Inputs (Dummy) */}
                  <div className="flex-1 flex flex-col gap-5">
                    <div>
                      <Label className="block text-sm font-semibold text-slate-700 mb-2">
                        Bodenrichtwert (BRW)
                      </Label>
                      <div className="relative">
                        <input
                          type="number"
                          defaultValue={450}
                          disabled
                          className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl px-4 py-3 font-medium cursor-not-allowed"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 font-medium">
                          €/m²
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Ermittelbar über das{" "}
                        <span className="text-navy-600">BORIS-Portal</span>{" "}
                        deines Bundeslandes.
                      </p>
                    </div>

                    <div>
                      <Label className="block text-sm font-semibold text-slate-700 mb-2">
                        Grundstücksgröße
                      </Label>
                      <div className="relative">
                        <input
                          type="number"
                          defaultValue={600}
                          disabled
                          className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl px-4 py-3 font-medium cursor-not-allowed"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 font-medium">
                          m²
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="block text-sm font-semibold text-slate-700 mb-2">
                          Baujahr
                        </Label>
                        <input
                          type="number"
                          defaultValue={1995}
                          disabled
                          className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl px-4 py-3 font-medium cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-semibold text-slate-700 mb-2">
                          Wohnfläche
                        </Label>
                        <div className="relative">
                          <input
                            type="number"
                            defaultValue={120}
                            disabled
                            className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl px-4 py-3 font-medium cursor-not-allowed"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 font-medium">
                            m²
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Visual Result (Donut Chart) */}
                  <div className="w-full xl:w-5/12 bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-center">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">
                      Berechnetes Verhältnis
                    </h3>
                    <div className="w-full h-[180px] flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {donutData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={DONUT_COLORS[index]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3 mt-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-navy-600" />
                          <span className="text-slate-600">Gebäude</span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {buildingSharePercent} %
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-slate-400" />
                          <span className="text-slate-600">
                            Grund &amp; Boden
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {100 - buildingSharePercent} %
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 text-center flex items-center justify-center gap-1">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Dieser Helfer wird in einer zukünftigen Version
                        funktionsfähig.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AfA Setup Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Abschreibungsparameter
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Method */}
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                AfA Methode
              </Label>
              <Select
                value={afaMethod}
                onValueChange={(
                  val: "linear" | "degressive" | "sonder" | null
                ) => {
                  if (val) updateData({ afa_method: val });
                }}
              >
                <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-navy-500">
                  <SelectValue placeholder="AfA Methode wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">
                    Lineare AfA (Standard)
                  </SelectItem>
                  <SelectItem value="degressive">
                    Degressive AfA (Neubau)
                  </SelectItem>
                  <SelectItem value="sonder">Sonder-AfA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rate */}
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                AfA Satz
              </Label>
              <div className="relative">
                <input
                  type="number"
                  value={afaRatePercent}
                  step="0.5"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData({
                      afa_rate_percent: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors font-medium"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 font-medium">
                  %
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Standard: 2% (Baujahr ab 1925), 2.5% (bis 1924), 3% (ab 2023)
              </p>
            </div>
          </div>

          {/* Date */}
          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">
              Startdatum der Abschreibung (Übergang Nutzen/Lasten)
            </Label>
            <input
              type="date"
              value={afaStartDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ afa_start_date: e.target.value })
              }
              className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors font-medium"
            />
          </div>
        </div>

        <StepFooter
          onBack={() => router.push(`/analysis/${analysisId}/step/10`)}
          isPending={isPending}
          primaryLabel="Weiter"
        />
      </div>

      {/* Right Column: Live Impact Preview */}
      <div className="w-full lg:w-5/12 flex flex-col">
        <div className="sticky top-24 flex flex-col gap-6">
          {/* Impact Summary Widget */}
          <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-1 relative overflow-hidden">
            {/* Decorative backgrounds */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-navy-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-emerald-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-white font-semibold">Impact Summary</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-4">
                {/* Annual Depreciation */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1">
                      Jährliche Abschreibung
                    </span>
                    <span className="text-white text-xl font-bold">
                      {formatCentsEur(annualDepreciationCents)}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>

                {/* Tax Shield */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-emerald-500/30 relative overflow-hidden flex justify-between items-center">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div>
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1">
                      Geschätzte Steuerersparnis
                    </span>
                    <span className="text-emerald-400 text-2xl font-bold">
                      {formatCentsEur(taxShieldCents)}{" "}
                      <span className="text-slate-500 text-sm font-normal">
                        / Jahr
                      </span>
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 flex items-start gap-4">
            <Lightbulb className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 leading-relaxed">
              Die Abschreibung mindert deinen zu versteuernden Überschuss, ohne
              dass dir tatsächlich Geld abfließt. Dies führt zu einem positiven
              Liquiditätseffekt (Tax Shield).
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
