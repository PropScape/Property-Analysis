"use client";

import { useState, useTransition, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { HelpAccordion } from "@/components/wizard/HelpAccordion";
import { StepFooter } from "@/components/wizard/StepFooter";
import { saveStepAction } from "@/actions/analysis";
import { useAnalysisStore } from "@/stores/analysis-store";
import { cn } from "@/lib/utils";
import type { Step5Data, RenovationMeasure } from "@/domain/types/wizard";
import { computeRenovationBreakdown } from "@/domain/calculations/renovation";
import type { RenovationBreakdown } from "@/domain/calculations/renovation";
import { formatCentsPlain, formatCentsEur } from "@/domain/calculations/currency";
import { WIZARD_DEFAULTS } from "@/config/wizard-defaults";
import { Hammer, Plus, Trash2, Scale, TrendingUp } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generates a simple client-side pseudo-UUID for measure identity. */
function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Parse a German-locale EUR string to integer cents (positive values only). */
function parseCents(raw: string): number {
  const cleaned = raw.replace(/\./g, "").replace(",", ".").trim();
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

// ---------------------------------------------------------------------------
// Types shared with the Impact Preview Card
// ---------------------------------------------------------------------------

export interface Step5LiveData {
  measures: RenovationMeasure[];
  previousInvestmentCents: number;
}

// ---------------------------------------------------------------------------
// MeasureCard — individual measure row
// ---------------------------------------------------------------------------

interface MeasureCardProps {
  measure: RenovationMeasure;
  index: number;
  isPending: boolean;
  onChange: (updated: RenovationMeasure) => void;
  onRemove: () => void;
}

function MeasureCard({ measure, index, isPending, onChange, onRemove }: MeasureCardProps) {
  const labelId = `step5-measure-label-${measure.id}`;
  const costId = `step5-measure-cost-${measure.id}`;
  const toggleId = `step5-measure-toggle-${measure.id}`;
  const finId = `step5-measure-fin-${measure.id}`;

  const [costDisplay, setCostDisplay] = useState(
    measure.cost_cents > 0 ? formatCentsPlain(measure.cost_cents) : ""
  );

  const handleCostBlur = () => {
    const cents = parseCents(costDisplay);
    setCostDisplay(cents > 0 ? formatCentsPlain(cents) : "");
    onChange({ ...measure, cost_cents: cents });
  };

  return (
    <div
      className={cn(
        "border border-slate-200 rounded-2xl p-5 flex flex-col gap-4",
        "hover:border-navy-200 transition-colors",
        "bg-slate-50/30 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
      )}
    >
      {/* Row 1: label + cost + delete */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          {/* Bezeichnung */}
          <div className="flex-1">
            <Label htmlFor={labelId} className="text-xs font-medium text-slate-500 mb-1 block">
              Bezeichnung
            </Label>
            <input
              id={labelId}
              type="text"
              value={measure.label}
              placeholder={`Maßnahme ${index + 1}`}
              maxLength={100}
              disabled={isPending}
              onChange={(e) => onChange({ ...measure, label: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-sm font-medium disabled:opacity-50"
            />
          </div>

          {/* Kosten */}
          <div className="w-full sm:w-40">
            <Label htmlFor={costId} className="text-xs font-medium text-slate-500 mb-1 block">
              Kosten
            </Label>
            <div className="relative">
              <input
                id={costId}
                type="text"
                inputMode="decimal"
                value={costDisplay}
                placeholder="0"
                disabled={isPending}
                onChange={(e) => {
                  setCostDisplay(e.target.value);
                  const cents = parseCents(e.target.value);
                  onChange({ ...measure, cost_cents: cents });
                }}
                onBlur={handleCostBlur}
                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-sm font-medium text-right disabled:opacity-50"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-slate-500 text-sm">€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Remove button */}
        <button
          type="button"
          id={`step5-remove-${measure.id}`}
          disabled={isPending}
          onClick={onRemove}
          aria-label="Maßnahme entfernen"
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-6 flex-shrink-0 disabled:pointer-events-none"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Row 2: timing toggle + fremdfinanziert checkbox */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
        {/* Timing toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Zeitpunkt:</span>

          {/* Shadcn-compatible toggle built with a native checkbox */}
          <button
            type="button"
            id={toggleId}
            role="switch"
            aria-checked={measure.is_immediate}
            disabled={isPending}
            onClick={() => onChange({ ...measure, is_immediate: !measure.is_immediate })}
            className={cn(
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent",
              "transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-navy-500/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              measure.is_immediate ? "bg-navy-600" : "bg-slate-300"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200",
                measure.is_immediate ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-semibold",
              measure.is_immediate ? "text-navy-600" : "text-slate-500"
            )}
          >
            {measure.is_immediate ? "Sofort" : "Über Jahre"}
          </span>
        </div>

        {/* Fremdfinanziert checkbox */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <input
            type="checkbox"
            id={finId}
            checked={measure.is_financed}
            disabled={isPending}
            onChange={(e) => onChange({ ...measure, is_financed: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500 disabled:opacity-50"
          />
          <label htmlFor={finId} className="cursor-pointer select-none">
            Fremdfinanziert
          </label>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step5Form
// ---------------------------------------------------------------------------

interface Step5FormProps {
  analysisId: string;
  initialData?: Partial<Step5Data> | null;
  onLiveDataChange?: (data: Step5LiveData) => void;
  previousInvestmentCents: number;
}

/**
 * Step 5 — Sanierungsmaßnahmen form.
 *
 * @remarks
 * Dynamic measure repeater with per-item timing toggle and financing flag.
 * A conditional financing details panel appears when at least one measure
 * is marked as `fremdfinanziert`.
 *
 * See SPEC-WIZARD-STEP5 v1.0.0.
 */
export function Step5Form({
  analysisId,
  initialData,
  onLiveDataChange,
  previousInvestmentCents,
}: Step5FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setStep5 = useAnalysisStore((s) => s.setStep5);
  const setCurrentStep = useAnalysisStore((s) => s.setCurrentStep);
  const saved = useAnalysisStore((s) => s.step5);

  // Hydrate measures: strip `id` from DB-loaded data and regenerate client IDs
  const hydrateFromDb = (
    raw: Partial<Step5Data>["measures"]
  ): RenovationMeasure[] => {
    if (!raw || raw.length === 0) return [];
    return raw.map((m) => ({ ...m, id: m.id ?? newId() }));
  };

  const [measures, setMeasures] = useState<RenovationMeasure[]>(() => {
    const source = initialData?.measures ?? saved.measures;
    return hydrateFromDb(source);
  });

  const [interestRate, setInterestRate] = useState(
    (
      initialData?.financing_interest_rate_percent ??
      saved.financing_interest_rate_percent ??
      WIZARD_DEFAULTS.renovationFinancingInterestPercent
    ).toString()
  );
  const [repaymentRate, setRepaymentRate] = useState(
    (
      initialData?.financing_repayment_rate_percent ??
      saved.financing_repayment_rate_percent ??
      WIZARD_DEFAULTS.renovationFinancingRepaymentPercent
    ).toString()
  );

  const [error, setError] = useState<string | null>(null);

  const hasFinanced = measures.some((m) => m.is_financed);

  // Notify shell of live data changes
  const notifyChange = useCallback(
    (updatedMeasures: RenovationMeasure[]) => {
      onLiveDataChange?.({ measures: updatedMeasures, previousInvestmentCents });
    },
    [onLiveDataChange, previousInvestmentCents]
  );

  const updateMeasures = (updated: RenovationMeasure[]) => {
    setMeasures(updated);
    notifyChange(updated);
  };

  const addMeasure = () => {
    if (measures.length >= 20) return;
    const newMeasure: RenovationMeasure = {
      id: newId(),
      label: "",
      cost_cents: 0,
      is_immediate: true,
      is_financed: false,
    };
    updateMeasures([...measures, newMeasure]);
  };

  const removeMeasure = (id: string) => {
    updateMeasures(measures.filter((m) => m.id !== id));
  };

  const updateMeasure = (updated: RenovationMeasure) => {
    updateMeasures(measures.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleSubmit = async () => {
    setError(null);

    const filteredMeasures = measures.filter(
      (m) => m.label.trim().length > 0 || m.cost_cents > 0
    );

    const payload: Step5Data = {
      measures: filteredMeasures.map(({ id: _id, ...rest }) => ({
        id: _id, // keep for schema validation, stripped server-side if needed
        ...rest,
      })),
      financing_interest_rate_percent: parseFloat(interestRate) || WIZARD_DEFAULTS.renovationFinancingInterestPercent,
      financing_repayment_rate_percent: parseFloat(repaymentRate) || WIZARD_DEFAULTS.renovationFinancingRepaymentPercent,
    };

    setStep5(payload);

    startTransition(async () => {
      const result = await saveStepAction({ analysisId, stepNumber: 5, data: payload as unknown as Record<string, unknown> });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCurrentStep(6);
      router.push(`/analysis/${analysisId}/step/6`);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-8">
      {/* ── Measures list ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 sm:p-8 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Geplante Maßnahmen
            </h3>
            <span className="text-xs text-slate-400 tabular-nums">
              {measures.length}/20
            </span>
          </div>

          {/* Measure cards */}
          <div className="flex flex-col gap-4">
            {measures.length === 0 && (
              <p className="text-sm text-slate-400 italic py-2">
                Noch keine Maßnahmen geplant. Klicke auf &bdquo;Maßnahme hinzufügen&ldquo;.
              </p>
            )}

            {measures.map((measure, idx) => (
              <MeasureCard
                key={measure.id}
                measure={measure}
                index={idx}
                isPending={isPending}
                onChange={updateMeasure}
                onRemove={() => removeMeasure(measure.id)}
              />
            ))}

            {/* Add button */}
            <button
              type="button"
              id="step5-add-measure"
              disabled={isPending || measures.length >= 20}
              onClick={addMeasure}
              className={cn(
                "w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-medium",
                "flex items-center justify-center gap-2 transition-all",
                "hover:border-navy-400 hover:text-navy-600 hover:bg-navy-50/50",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:hover:bg-transparent"
              )}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Maßnahme hinzufügen
            </button>
          </div>
        </div>

        {/* ── Conditional financing section ──────────────────────────── */}
        {hasFinanced && (
          <>
            <hr className="border-slate-100" />
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <Scale className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <h4 className="text-sm font-semibold text-slate-800">
                  Finanzierungsdetails für Maßnahmen
                </h4>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Falls Maßnahmen über einen separaten Kredit finanziert werden,
                gib hier die Konditionen an.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Zinssatz */}
                <div>
                  <label
                    htmlFor="step5-interest-rate"
                    className="text-xs font-medium text-slate-600 mb-1 block"
                  >
                    Zinssatz
                  </label>
                  <div className="relative">
                    <input
                      id="step5-interest-rate"
                      type="number"
                      min={0}
                      max={20}
                      step={0.1}
                      value={interestRate}
                      disabled={isPending}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-sm text-right disabled:opacity-50"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Tilgung */}
                <div>
                  <label
                    htmlFor="step5-repayment-rate"
                    className="text-xs font-medium text-slate-600 mb-1 block"
                  >
                    Tilgung
                  </label>
                  <div className="relative">
                    <input
                      id="step5-repayment-rate"
                      type="number"
                      min={0}
                      max={20}
                      step={0.1}
                      value={repaymentRate}
                      disabled={isPending}
                      onChange={(e) => setRepaymentRate(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-sm text-right disabled:opacity-50"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Help accordion ─────────────────────────────────────────────── */}
      <HelpAccordion triggerLabel="Warum brauchen wir diese Daten?">
        <p className="text-sm text-slate-600 leading-relaxed">
          Sanierungsmaßnahmen erhöhen deinen Investitionsbedarf, können jedoch
          den Wert der Immobilie steigern und steuerlich relevant sein (AfA vs.
          Erhaltungsaufwand). Die genaue steuerliche Aufteilung wird in Schritt
          12 behandelt.
        </p>
      </HelpAccordion>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
          {error}
        </p>
      )}

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <StepFooter
        showBack
        onBack={() => router.push(`/analysis/${analysisId}/step/4`)}
        isPending={isPending}
        primaryLabel="Weiter zur Finanzierung"
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Step5ImpactPreviewCard
// ---------------------------------------------------------------------------

interface ImpactPreviewCardProps {
  data: Step5LiveData;
}

/**
 * Impact Preview sidebar card for Step 5.
 *
 * @remarks
 * Shows previous total investment (from steps 3+4), itemised measure totals,
 * and the new Gesamtinvestition. Updates reactively on every change.
 *
 * See SPEC-WIZARD-STEP5 v1.0.0, AC-8.
 */
export function Step5ImpactPreviewCard({ data }: ImpactPreviewCardProps) {
  const { measures, previousInvestmentCents } = data;

  const breakdown = computeRenovationBreakdown(measures, previousInvestmentCents);

  const show = previousInvestmentCents > 0;

  return (
    <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
        Impact Preview
      </h3>

      <div className="flex flex-col gap-2 font-mono text-xs">
        {/* Previous investment */}
        <div className="flex justify-between items-center text-slate-400 gap-2">
          <span className="whitespace-nowrap">Investition bisher</span>
          <span className="tabular-nums whitespace-nowrap flex-shrink-0">
            {show ? formatCentsEur(previousInvestmentCents) : "—"}
          </span>
        </div>

        <div className="border-t border-dashed border-slate-200 my-0.5" />

        {/* Immediate measures */}
        <div className="flex justify-between items-center text-slate-700 font-semibold gap-2">
          <span className="whitespace-nowrap">Sofortmaßnahmen</span>
          <span className="tabular-nums whitespace-nowrap flex-shrink-0 text-navy-600">
            {breakdown.immediateCents > 0
              ? formatCentsEur(breakdown.immediateCents)
              : "—"}
          </span>
        </div>

        {/* Deferred measures */}
        <div className="flex justify-between items-center text-slate-500 gap-2">
          <span className="whitespace-nowrap">Spätere Maßnahmen</span>
          <span className="tabular-nums whitespace-nowrap flex-shrink-0">
            {breakdown.deferredCents > 0
              ? formatCentsEur(breakdown.deferredCents)
              : "—"}
          </span>
        </div>

        <div className="border-t border-dashed border-slate-200 my-0.5" />

        {/* New total */}
        <div className="flex justify-between items-center text-slate-800 font-bold gap-2">
          <span className="whitespace-nowrap">Gesamtinvestition</span>
          <span className="tabular-nums whitespace-nowrap flex-shrink-0">
            {show ? formatCentsEur(breakdown.newTotalInvestmentCents) : "—"}
          </span>
        </div>
      </div>

      {/* Tax relevance info */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-700">
          <Scale className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Steuerliche Relevanz
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Die genaue Aufteilung in anschaffungsnahe Herstellkosten (AfA) und
          sofort abzugsfähige Erhaltungsaufwendungen{" "}
          <span className="font-medium text-slate-700">
            wird im Steuer-Teil berücksichtigt.
          </span>
        </p>
      </div>
    </div>
  );
}
