"use client";

import { useState, useTransition, useId } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { HelpAccordion } from "@/components/wizard/HelpAccordion";
import { StepFooter } from "@/components/wizard/StepFooter";
import { saveStepAction } from "@/actions/analysis";
import { useAnalysisStore } from "@/stores/analysis-store";
import { cn } from "@/lib/utils";
import type { Step3Data } from "@/domain/types/wizard";
import { parseToCents, formatCentsPlain } from "@/domain/calculations/currency";
import { computeRentalKpis } from "@/domain/calculations/rental-kpis";
import type { RentalKpis } from "@/domain/calculations/rental-kpis";
import { CalendarDays, Euro, Zap } from "lucide-react";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Step3FormProps {
  analysisId: string;
  /**
   * Previously saved step data loaded from the DB by the Server Component.
   * Takes priority over the Zustand store on initial render so fields are
   * populated after a page reload (DB = source of truth).
   */
  initialData?: Partial<Step3Data> | null;
  /**
   * Called whenever the purchase-price display string changes.
   * Used by `Step3Shell` to keep the live KPI sidebar in sync.
   */
  onPurchaseChange?: (value: string) => void;
  /**
   * Called whenever the cold-rent display string changes.
   * Used by `Step3Shell` to keep the live KPI sidebar in sync.
   */
  onColdRentChange?: (value: string) => void;
  /**
   * Called whenever the vacancy rate changes.
   * Used by `Step3Shell` to keep the live KPI sidebar in sync.
   */
  onVacancyChange?: (value: number) => void;
}

/**
 * Step 3 — "Kaufpreis & Miete" form.
 *
 * @remarks
 * Sections (mirrors HTML mockup exactly):
 * 1. Kaufpreis — large euro input
 * 2. Mieteinnahmen — cold rent, warm rent (optional), rent start date
 * 3. Annahmen — vacancy rate slider + rent growth toggle + growth rate
 * 4. Live KPI preview (rendered in the right sidebar by the page, but
 *    this form exposes a `computedKpis` value via the returned JSX for
 *    the sidebar to consume via props — instead the sidebar is co-located
 *    in this component as an exported helper)
 *
 * All monetary values are stored as integer cents.
 *
 * See SPEC-WIZARD-STEP3 v1.0.0.
 */
export function Step3Form({
  analysisId,
  initialData,
  onPurchaseChange,
  onColdRentChange,
  onVacancyChange,
}: Step3FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const vacancyId = useId();
  const rentGrowthToggleId = useId();

  const setStep3 = useAnalysisStore((s) => s.setStep3);
  const setCurrentStep = useAnalysisStore((s) => s.setCurrentStep);
  const saved = useAnalysisStore((s) => s.step3);

  // DB data (initialData) takes priority over the Zustand store on mount.
  const initialPurchase = initialData?.purchase_price_cents ?? saved.purchase_price_cents;
  const initialCold = initialData?.cold_rent_cents ?? saved.cold_rent_cents;
  const initialWarm = initialData?.warm_rent_cents ?? saved.warm_rent_cents;

  const [purchaseDisplay, setPurchaseDisplay] = useState(
    initialPurchase ? formatCentsPlain(initialPurchase) : ""
  );
  const [coldRentDisplay, setColdRentDisplay] = useState(
    initialCold ? formatCentsPlain(initialCold) : ""
  );
  const [warmRentDisplay, setWarmRentDisplay] = useState(
    initialWarm ? formatCentsPlain(initialWarm) : ""
  );
  const [rentStartDate, setRentStartDate] = useState(
    initialData?.rent_start_date ?? saved.rent_start_date ?? ""
  );
  const [vacancyRate, setVacancyRate] = useState(
    initialData?.vacancy_rate_percent ?? saved.vacancy_rate_percent ?? 2
  );
  const [rentGrowthEnabled, setRentGrowthEnabled] = useState(
    initialData?.rent_growth_enabled ?? saved.rent_growth_enabled ?? true
  );
  const [growthRateDisplay, setGrowthRateDisplay] = useState(
    (initialData?.rent_growth_rate_percent ?? saved.rent_growth_rate_percent ?? 1.5).toString()
  );
  const [error, setError] = useState<string | null>(null);

  // Derived cents for KPI calculation
  const purchaseCents = parseToCents(purchaseDisplay);
  const coldRentCents = parseToCents(coldRentDisplay);
  const kpis = computeRentalKpis(purchaseCents, coldRentCents, vacancyRate);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsedPurchase = parseToCents(purchaseDisplay);
    const parsedCold = parseToCents(coldRentDisplay);
    const parsedWarm = warmRentDisplay ? parseToCents(warmRentDisplay) : undefined;
    const parsedGrowthRate = parseFloat(growthRateDisplay);

    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 3,
        data: {
          purchase_price_cents: parsedPurchase ?? 0,
          cold_rent_cents: parsedCold ?? 0,
          warm_rent_cents: parsedWarm ?? undefined,
          rent_start_date: rentStartDate,
          vacancy_rate_percent: vacancyRate,
          rent_growth_enabled: rentGrowthEnabled,
          rent_growth_rate_percent: rentGrowthEnabled
            ? (isNaN(parsedGrowthRate) ? undefined : parsedGrowthRate)
            : undefined,
        },
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Persist to Zustand (in-session cache)
      setStep3({
        purchase_price_cents: parsedPurchase ?? undefined,
        cold_rent_cents: parsedCold ?? undefined,
        warm_rent_cents: parsedWarm ?? undefined,
        rent_start_date: rentStartDate,
        vacancy_rate_percent: vacancyRate,
        rent_growth_enabled: rentGrowthEnabled,
        rent_growth_rate_percent: rentGrowthEnabled && !isNaN(parsedGrowthRate)
          ? parsedGrowthRate
          : undefined,
      });
      setCurrentStep(4);
      router.push(`/analysis/${analysisId}/step/4`);
    });
  }

  function handleBack() {
    router.push(`/analysis/${analysisId}/step/2`);
  }

  return (
    <form id="step-3-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* White card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 sm:p-8 flex flex-col gap-8">

        {/* 1. Purchase price */}
        <div className="flex flex-col gap-3">
          <Label
            htmlFor="step3-purchase-price"
            className="text-sm font-semibold text-slate-900 flex items-center justify-between"
          >
            Kaufpreis der Immobilie{" "}
            <span className="text-red-500" aria-hidden="true">*</span>
            <span className="text-xs font-normal text-slate-500 ml-auto">
              Ohne Nebenkosten
            </span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Euro className="w-4 h-4 text-slate-500" aria-hidden="true" />
            </div>
            <input
              id="step3-purchase-price"
              type="text"
              inputMode="numeric"
              placeholder="350.000"
              value={purchaseDisplay}
              onChange={(e) => {
                setPurchaseDisplay(e.target.value);
                onPurchaseChange?.(e.target.value);
              }}
              disabled={isPending}
              className={cn(
                "w-full pl-10 pr-4 py-4 rounded-xl border-2 border-slate-200 bg-slate-50",
                "text-slate-900 font-bold text-xl text-right placeholder-slate-400",
                "focus:outline-none focus:ring-4 focus:ring-navy-600/10 focus:border-navy-600 focus:bg-white",
                "transition-all disabled:opacity-50"
              )}
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* 2. Rent inputs */}
        <div className="flex flex-col gap-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Mieteinnahmen
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Cold rent */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="step3-cold-rent" className="text-sm font-medium text-slate-700">
                Kaltmiete (monatlich){" "}
                <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  €
                </span>
                <input
                  id="step3-cold-rent"
                  type="text"
                  inputMode="numeric"
                  placeholder="1.250"
                  value={coldRentDisplay}
                  onChange={(e) => {
                    setColdRentDisplay(e.target.value);
                    onColdRentChange?.(e.target.value);
                  }}
                  disabled={isPending}
                  className={cn(
                    "w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50",
                    "text-slate-900 text-base text-right",
                    "focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 focus:bg-white",
                    "transition-all disabled:opacity-50"
                  )}
                />
              </div>
            </div>

            {/* Warm rent — optional */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="step3-warm-rent" className="text-sm font-medium text-slate-700">
                Warmmiete{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  €
                </span>
                <input
                  id="step3-warm-rent"
                  type="text"
                  inputMode="numeric"
                  placeholder="1.450"
                  value={warmRentDisplay}
                  onChange={(e) => setWarmRentDisplay(e.target.value)}
                  disabled={isPending}
                  className={cn(
                    "w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50",
                    "text-slate-900 text-base text-right",
                    "focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 focus:bg-white",
                    "transition-all disabled:opacity-50"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Rent start date */}
          <div className="flex flex-col gap-2 sm:w-1/2">
            <Label htmlFor="step3-rent-start" className="text-sm font-medium text-slate-700">
              Mietbeginn / Übernahme{" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <CalendarDays
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="step3-rent-start"
                type="date"
                value={rentStartDate}
                onChange={(e) => setRentStartDate(e.target.value)}
                disabled={isPending}
                className={cn(
                  "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50",
                  "text-slate-900 text-base appearance-none",
                  "focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 focus:bg-white",
                  "transition-all disabled:opacity-50"
                )}
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* 3. Assumptions */}
        <div className="flex flex-col gap-6">

          {/* Vacancy rate slider */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={vacancyId}
                className="text-sm font-semibold text-slate-900"
              >
                Angenommener Leerstand
              </Label>
              <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md tabular-nums">
                {vacancyRate.toFixed(1)} %
              </span>
            </div>
            {/* Custom styled range input */}
            <div className="relative pt-1">
              <input
                id={vacancyId}
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={vacancyRate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVacancyRate(v);
                  onVacancyChange?.(v);
                }}
                disabled={isPending}
                aria-label="Leerstandsrate in Prozent"
                className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-navy-600 disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-slate-500">
              Puffer für Mieterwechsel (empfohlen: 2–3&nbsp;%)
            </p>
          </div>

          {/* Rent growth toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-900">
                Mietsteigerung einkalkulieren
              </span>
              <span className="text-xs text-slate-500">
                Automatische jährliche Anpassung (Indexmiete)
              </span>
            </div>
            {/* Toggle switch — pure CSS */}
            <label
              htmlFor={rentGrowthToggleId}
              className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4"
              aria-label="Mietsteigerung aktivieren"
            >
              <input
                id={rentGrowthToggleId}
                type="checkbox"
                className="sr-only peer"
                checked={rentGrowthEnabled}
                onChange={(e) => setRentGrowthEnabled(e.target.checked)}
                disabled={isPending}
              />
              <div
                className={cn(
                  "w-12 h-6 rounded-full transition-colors duration-300",
                  "bg-slate-300 peer-checked:bg-navy-600",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-navy-600/30",
                  "after:content-[''] after:absolute after:top-[3px] after:left-[3px]",
                  "after:bg-white after:rounded-full after:h-[18px] after:w-[18px]",
                  "after:transition-transform after:duration-300",
                  "peer-checked:after:translate-x-6",
                  "after:shadow-sm"
                )}
              />
            </label>
          </div>

          {/* Conditional: rent growth rate */}
          {rentGrowthEnabled && (
            <div className="flex items-center gap-4 pl-4 border-l-2 border-navy-200">
              <Label
                htmlFor="step3-growth-rate"
                className="text-sm font-medium text-slate-700 whitespace-nowrap"
              >
                Jährliche Steigerung
              </Label>
              <div className="relative w-28">
                <input
                  id="step3-growth-rate"
                  type="number"
                  min={0}
                  max={20}
                  step={0.1}
                  value={growthRateDisplay}
                  onChange={(e) => setGrowthRateDisplay(e.target.value)}
                  disabled={isPending}
                  className={cn(
                    "w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-white",
                    "text-slate-900 text-sm text-right",
                    "focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20",
                    "transition-all disabled:opacity-50"
                  )}
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-sm pointer-events-none">
                  %
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Help accordion */}
        <HelpAccordion triggerLabel="Warum brauchen wir diese Daten?">
          <p>
            <strong>Kaufpreis</strong> und <strong>Kaltmiete</strong> sind die
            Basis für alle Rendite-Kennzahlen. Die{" "}
            <strong>Bruttomietrendite</strong> zeigt sofort, ob die Immobilie
            grundsätzlich wirtschaftlich ist. Der{" "}
            <strong>Leerstand-Puffer</strong> simuliert Mieterwechsel-Phasen
            und gibt ein realistischeres Bild der Einnahmen.
          </p>
        </HelpAccordion>
      </div>

      {/* Inline error */}
      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <StepFooter
        showBack
        onBack={handleBack}
        isPending={isPending}
        primaryLabel="Weiter zu Kaufnebenkosten"
      />

      {/* Hidden live KPI data for the sidebar — passed via data attributes */}
      <output
        htmlFor="step-3-form"
        aria-live="polite"
        aria-label="Rendite-Vorschau"
        className="sr-only"
      >
        {kpis.grossYieldPercent !== null
          ? `Bruttomietrendite: ${kpis.grossYieldPercent.toFixed(2)} %`
          : "Bitte Kaufpreis und Kaltmiete eingeben"}
      </output>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Live KPI Preview Card — rendered by the page in the right sidebar
// ---------------------------------------------------------------------------

interface KpiPreviewCardProps {
  purchaseDisplayValue: string;
  coldRentDisplayValue: string;
  vacancyRate: number;
}

/**
 * Live KPI preview card for the right sidebar.
 *
 * @remarks
 * Receives raw display strings (as typed by the user) and computes KPIs
 * client-side. This avoids a server round-trip for the live preview.
 */
export function Step3KpiPreviewCard({
  purchaseDisplayValue,
  coldRentDisplayValue,
  vacancyRate,
}: KpiPreviewCardProps) {
  const purchaseCents = parseToCents(purchaseDisplayValue);
  const coldRentCents = parseToCents(coldRentDisplayValue);
  const kpis = computeRentalKpis(purchaseCents, coldRentCents, vacancyRate);

  const yieldColor =
    kpis.grossYieldPercent === null
      ? "text-slate-400"
      : kpis.grossYieldPercent >= 4
      ? "text-emerald-600"
      : kpis.grossYieldPercent >= 2
      ? "text-amber-500"
      : "text-red-500";

  const yieldLabel =
    kpis.grossYieldPercent === null
      ? null
      : kpis.grossYieldPercent >= 5
      ? "Sehr guter Wert (> 5%)"
      : kpis.grossYieldPercent >= 4
      ? "Solider Wert (> 4%)"
      : kpis.grossYieldPercent >= 2
      ? "Unterdurchschnittlich"
      : "Kritischer Wert (< 2%)";

  const dotColor =
    kpis.grossYieldPercent === null
      ? "bg-slate-300"
      : kpis.grossYieldPercent >= 4
      ? "bg-emerald-500"
      : kpis.grossYieldPercent >= 2
      ? "bg-amber-400"
      : "bg-red-500";

  return (
    <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-navy-100 relative overflow-hidden">
      {/* Background watermark */}
      <div className="absolute top-0 right-0 p-4 opacity-5" aria-hidden="true">
        <Zap className="w-16 h-16 text-navy-500" />
      </div>

      <h3 className="text-xs font-bold text-navy-600 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Zap className="w-3 h-3" aria-hidden="true" />
        Live Vorschau
      </h3>

      <div className="flex flex-col gap-6">
        {/* Gross yield */}
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
          <span className="text-sm font-medium text-slate-500">Bruttomietrendite</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900 tracking-tight tabular-nums">
              {kpis.grossYieldPercent !== null
                ? kpis.grossYieldPercent.toFixed(2).replace(".", ",")
                : "—"}
            </span>
            <span className="text-xl font-semibold text-slate-500">%</span>
          </div>
          {yieldLabel && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className={cn("w-2 h-2 rounded-full", dotColor)} />
              <span className={cn("text-xs font-medium", yieldColor)}>
                {yieldLabel}
              </span>
            </div>
          )}
        </div>

        {/* Annual net rent */}
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
          <span className="text-sm font-medium text-slate-500">Nettokaltmiete p.a.</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
              {kpis.netAnnualRentEur !== null
                ? new Intl.NumberFormat("de-DE", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(kpis.netAnnualRentEur)
                : "—"}
            </span>
            <span className="text-lg font-semibold text-slate-500">€</span>
          </div>
          {coldRentCents && (
            <span className="text-xs text-slate-400 mt-1">
              Monatlich: {formatCentsPlain(coldRentCents)}&thinsp;€ (vor Leerstand)
            </span>
          )}
        </div>

        {/* Purchase price factor */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-500">Kaufpreisfaktor</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {kpis.purchasePriceFactor !== null
                ? kpis.purchasePriceFactor.toFixed(1).replace(".", ",")
                : "—"}
            </span>
            <span className="text-sm font-medium text-slate-500">Jahre</span>
          </div>
          <span className="text-xs text-slate-400 mt-1">
            Bis sich die Immobilie selbst bezahlt
          </span>
        </div>
      </div>
    </div>
  );
}
