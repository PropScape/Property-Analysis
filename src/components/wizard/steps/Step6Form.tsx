"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HelpAccordion } from "@/components/wizard/HelpAccordion";
import { StepFooter } from "@/components/wizard/StepFooter";
import { KpiSidebarPlaceholder } from "@/components/wizard/KpiSidebarPlaceholder";
import { HeartPulse, CalendarCheck } from "lucide-react";
import { formatCentsEur } from "@/domain/calculations/currency";
import { computeFinancingBreakdown } from "@/domain/calculations/financing";
import { saveStepAction } from "@/actions/analysis";
import { useAnalysisStore } from "@/stores/analysis-store";
import type { Step6Data } from "@/domain/types/wizard";

/** Live context maintained by the shell. */
export interface Step6ContextData {
  equity_cents: number;
  loan_interest_rate_percent: number;
  loan_repayment_rate_percent: number;
  totalInvestmentCents: number;
}

export interface Step6FormProps {
  analysisId: string;
  initialData?: Partial<Step6Data> | null;
  totalInvestmentCents: number;
  onLiveChange: (data: Step6ContextData) => void;
  defaultInterestRate: number;
  defaultRepaymentRate: number;
  defaultFixationYears: number;
}

/**
 * Step 6: Finanzierung Form
 *
 * @remarks
 * Renders the main loan configuration including Equity, Interest, Repayment,
 * and Fixation period. The second tranche is excluded for MVP based on user input.
 *
 * See SPEC-WIZARD-STEP6 v1.0.0.
 */
export function Step6Form({
  analysisId,
  initialData,
  totalInvestmentCents,
  onLiveChange,
  defaultInterestRate,
  defaultRepaymentRate,
  defaultFixationYears,
}: Step6FormProps) {
  const router = useRouter();
  const setStep6 = useAnalysisStore((state) => state.setStep6);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Field states
  const [equityCents, setEquityCents] = useState(
    initialData?.equity_cents ?? 0
  );
  const [interestRate, setInterestRate] = useState(
    initialData?.loan_interest_rate_percent ?? defaultInterestRate
  );
  const [repaymentRate, setRepaymentRate] = useState(
    initialData?.loan_repayment_rate_percent ?? defaultRepaymentRate
  );
  const [fixationYears, setFixationYears] = useState(
    initialData?.loan_fixation_years ?? defaultFixationYears
  );
  const [processingFeeCents, setProcessingFeeCents] = useState(
    initialData?.loan_processing_fee_cents ?? 0
  );

  // Auto-calculated LTV and Loan Amount for the UI
  const { loanAmountCents, ltvPercent } = computeFinancingBreakdown(
    equityCents,
    totalInvestmentCents,
    interestRate,
    repaymentRate
  );

  // Notify shell of live changes for the sidebar
  useEffect(() => {
    onLiveChange({
      equity_cents: equityCents,
      loan_interest_rate_percent: interestRate,
      loan_repayment_rate_percent: repaymentRate,
      totalInvestmentCents,
    });
  }, [
    equityCents,
    interestRate,
    repaymentRate,
    totalInvestmentCents,
    onLiveChange,
  ]);

  const handleLtvChange = (newLtv: number) => {
    // equity = total - (total * ltv / 100)
    const newLoanAmount = (totalInvestmentCents * newLtv) / 100;
    const newEquity = totalInvestmentCents - newLoanAmount;
    setEquityCents(Math.round(newEquity));
  };

  const handleSubmit = () => {
    setError(null);
    const payload: Step6Data = {
      equity_cents: equityCents,
      loan_interest_rate_percent: interestRate,
      loan_repayment_rate_percent: repaymentRate,
      loan_fixation_years: fixationYears,
      loan_processing_fee_cents: processingFeeCents,
    };

    setStep6(payload);

    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 6,
        data: payload as unknown as Record<string, unknown>,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/analysis/${analysisId}/step/7`);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-8">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 sm:p-8 flex flex-col gap-8">
        
        {/* ── Equity & LTV ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-900">
              Eigenkapital & Beleihungsauslauf (LTV)
            </label>
            <span className="text-xs font-medium text-slate-500">
              Gesamtkosten: {formatCentsEur(totalInvestmentCents)}
            </span>
          </div>

          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Eigenkapital
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={Math.round(equityCents / 100)}
                    onChange={(e) =>
                      setEquityCents(Number(e.target.value) * 100)
                    }
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-semibold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">€</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Darlehenssumme (Auto-Calc)
                </label>
                <div className="relative opacity-80">
                  <input
                    type="number"
                    value={Math.round(loanAmountCents / 100)}
                    readOnly
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 focus:outline-none text-base font-semibold cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">€</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Beleihungsauslauf (LTV)</span>
                <span className="text-navy-600 font-bold text-sm">
                  {Math.round(ltvPercent)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(ltvPercent)}
                onChange={(e) => handleLtvChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #1e3a8a ${ltvPercent}%, #e2e8f0 ${ltvPercent}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* ── Main Loan Conditions ─────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Konditionen Hauptdarlehen
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Sollzins (p.a.)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-medium"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-500">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Anfängliche Tilgung (p.a.)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={repaymentRate}
                  onChange={(e) => setRepaymentRate(Number(e.target.value))}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-medium"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-500">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Zinsbindung
              </label>
              <div className="relative">
                <select
                  value={fixationYears}
                  onChange={(e) => setFixationYears(Number(e.target.value))}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-medium appearance-none"
                >
                  <option value={5}>5 Jahre</option>
                  <option value={10}>10 Jahre</option>
                  <option value={15}>15 Jahre</option>
                  <option value={20}>20 Jahre</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs">▼</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Bearbeitungsgebühr (optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={Math.round(processingFeeCents / 100)}
                  onChange={(e) =>
                    setProcessingFeeCents(Number(e.target.value) * 100)
                  }
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 text-base font-medium"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-500">€</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HelpAccordion triggerLabel="Warum brauchen wir diese Daten?">
        <p className="text-sm text-slate-600 leading-relaxed">
          Die Finanzierungsstruktur bestimmt deinen monatlichen Kapitaldienst
          (Zins und Tilgung) und den effektiven Cashflow. Die LTV
          (Loan-to-Value) Rate gibt das Verhältnis von Darlehen zu
          Gesamtkosten an.
        </p>
      </HelpAccordion>

      {error && (
        <p role="alert" className="text-sm text-red-500 font-medium">
          {error}
        </p>
      )}

      <StepFooter
        showBack
        onBack={() => router.push(`/analysis/${analysisId}/step/5`)}
        isPending={isPending}
        primaryLabel="Weiter zu Hausgeld"
      />
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Financial Health Sidebar
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders the live Financial Health card.
 */
export function Step6FinancialHealthCard({
  data,
}: {
  data: Step6ContextData;
}) {
  const { monthlyPaymentCents, yearsToPayoff } = computeFinancingBreakdown(
    data.equity_cents,
    data.totalInvestmentCents,
    data.loan_interest_rate_percent,
    data.loan_repayment_rate_percent
  );

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
        <HeartPulse className="w-4 h-4 text-navy-500" /> Financial Health
      </h3>

      {/* Monthly Debt Service */}
      <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
        <span className="text-xs font-medium text-slate-500 mb-1 text-center">
          Monatliche Rate (Kapitaldienst)
        </span>
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatCentsEur(monthlyPaymentCents)}
        </span>
        <span className="text-xs text-slate-400 mt-1">Zins + Tilgung</span>
      </div>

      {/* Repayment Schedule Hint */}
      {yearsToPayoff > 0 ? (
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-navy-50/50 border border-navy-100 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-navy-700">
              <CalendarCheck className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Volltilgung
              </span>
            </div>
            <p className="text-xs text-navy-600/80 leading-relaxed">
              Bei gleichbleibenden Konditionen ist das Darlehen in ca.{" "}
              <span className="font-bold">{yearsToPayoff} Jahren</span>{" "}
              vollständig getilgt.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
