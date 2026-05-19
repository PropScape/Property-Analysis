"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  ReceiptText, 
  Calculator, 
  ListChecks, 
  Target, 
  ChevronDown 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCentsEur } from "@/domain/calculations/currency";
import { StepFooter } from "@/components/wizard/StepFooter";

interface Step9ShellProps {
  analysisId: string;
  preTaxCashflowCents: number;
  grossYieldPercent: number | null;
  roePercent: number | null;
}

export function Step9Shell({
  analysisId,
  preTaxCashflowCents,
  grossYieldPercent,
  roePercent,
}: Step9ShellProps) {
  const router = useRouter();
  const [openAccordion, setOpenAccordion] = useState<string | null>("acc-1");

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto min-h-[calc(100vh-16rem)]">
      
      {/* Pre-Tax KPI Summary Ribbon */}
      <div className="w-full max-w-[1000px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pre-Tax Cashflow</span>
            <span className="text-xl font-bold text-slate-900">
              {formatCentsEur(preTaxCashflowCents).replace(' €', '')} <span className="text-sm font-medium text-slate-500">€ / mtl.</span>
            </span>
          </div>
        </div>
        <div className="hidden sm:block h-10 w-[1px] bg-slate-200"></div>
        <div className="flex items-center gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block sm:text-right">Bruttomietrendite</span>
            <span className="text-xl font-bold text-slate-900">
              {grossYieldPercent !== null ? grossYieldPercent.toFixed(1) : "—"} <span className="text-sm font-medium text-slate-500">%</span>
            </span>
          </div>
        </div>
        <div className="hidden sm:block h-10 w-[1px] bg-slate-200"></div>
        <div className="flex items-center gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block sm:text-right">Eigenkapitalrendite</span>
            <span className="text-xl font-bold text-slate-900">
              {roePercent !== null ? roePercent.toFixed(1) : "—"} <span className="text-sm font-medium text-slate-500">%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="w-full max-w-[800px] mx-auto text-center mt-6 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-navy-50 text-navy-600 flex items-center justify-center mx-auto mb-6 shadow-sm border border-navy-100">
          <ReceiptText className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">Steuerliche Betrachtung</h1>
        <p className="text-slate-500 text-lg leading-relaxed max-w-2xl mx-auto">
          Der Cashflow vor Steuern ist nur die halbe Wahrheit. In den nächsten Schritten berechnen wir die steuerlichen Auswirkungen deiner Investition, inklusive Abschreibungen (AfA) und Zinsabzugsfähigkeit, um deinen echten Netto-Cashflow zu ermitteln.
        </p>
      </div>

      {/* Explanation Accordion */}
      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-4 mb-10">
        
        {/* Accordion Item 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button 
            type="button"
            className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
            onClick={() => toggleAccordion('acc-1')}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-900 text-left">Was wird berechnet?</span>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", openAccordion === 'acc-1' && "rotate-180")} />
          </button>
          <div 
            className={cn(
              "px-6 bg-white transition-all duration-300 overflow-hidden",
              openAccordion === 'acc-1' ? "max-h-[500px] pb-6 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <p className="text-sm text-slate-600 leading-relaxed pt-2">
              Wir ermitteln deinen individuellen steuerlichen Überschuss. Dabei werden deine Mieteinnahmen abzüglich der Werbungskosten (Zinsen, nicht umlagefähige Nebenkosten, Instandhaltung) und der Gebäudeabschreibung (AfA) berechnet. Das Ergebnis wird mit deinem persönlichen Steuersatz multipliziert.
            </p>
          </div>
        </div>

        {/* Accordion Item 2 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button 
            type="button"
            className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
            onClick={() => toggleAccordion('acc-2')}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                <ListChecks className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-900 text-left">Welche Eingaben werden benötigt?</span>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", openAccordion === 'acc-2' && "rotate-180")} />
          </button>
          <div 
            className={cn(
              "px-6 bg-white transition-all duration-300 overflow-hidden",
              openAccordion === 'acc-2' ? "max-h-[500px] pb-6 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <ul className="text-sm text-slate-600 leading-relaxed pt-2 space-y-2 list-disc list-inside">
              <li>Dein persönlicher Grenzsteuersatz (Einkommensteuer + Soli + ggf. Kirchensteuer)</li>
              <li>Gebäudeanteil am Kaufpreis (für die AfA-Berechnung)</li>
              <li>Baujahr der Immobilie (bestimmt den AfA-Satz: 2%, 2.5% oder 3%)</li>
              <li>Gewählte Rechtsform (Privatperson oder vermögensverwaltende GmbH)</li>
            </ul>
          </div>
        </div>

        {/* Accordion Item 3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button 
            type="button"
            className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
            onClick={() => toggleAccordion('acc-3')}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-900 text-left">Was ist das Ergebnis?</span>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", openAccordion === 'acc-3' && "rotate-180")} />
          </button>
          <div 
            className={cn(
              "px-6 bg-white transition-all duration-300 overflow-hidden",
              openAccordion === 'acc-3' ? "max-h-[500px] pb-6 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <p className="text-sm text-slate-600 leading-relaxed pt-2">
              Am Ende dieses Moduls erhältst du deinen <strong>Cashflow nach Steuern</strong>. Dies ist der tatsächliche Betrag, der am Ende des Monats auf deinem Konto bleibt (oder den du zuzahlen musst), nachdem das Finanzamt seinen Anteil erhalten oder erstattet hat.
            </p>
          </div>
        </div>

      </div>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/analysis/${analysisId}/step/10`);
        }}
        className="mt-auto"
      >
        <StepFooter
          onBack={() => router.push(`/analysis/${analysisId}/step/8`)}
          primaryLabel="Jetzt Steuer berechnen"
        />
      </form>

    </div>
  );
}
