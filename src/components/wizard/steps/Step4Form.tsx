"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { HelpAccordion } from "@/components/wizard/HelpAccordion";
import { StepFooter } from "@/components/wizard/StepFooter";
import { saveStepAction } from "@/actions/analysis";
import { useAnalysisStore } from "@/stores/analysis-store";
import { cn } from "@/lib/utils";
import type { Step4Data, Bundesland, CustomCostItem } from "@/domain/types/wizard";
import {
  BUNDESLAND_TAX_RATES,
  BUNDESLAND_OPTIONS,
  computeAncillaryCosts,
} from "@/domain/calculations/acquisition-costs";
import { formatCentsPlain, applyPercent } from "@/domain/calculations/currency";
import { WIZARD_DEFAULTS } from "@/config/wizard-defaults";
import { Receipt, Plus, Trash2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types shared with the Summary Card
// ---------------------------------------------------------------------------

export interface Step4LiveData {
  purchasePriceCents: number;
  brokerFeePercent: number;
  notaryFeePercent: number;
  landRegistryFeePercent: number;
  bundesland: Bundesland;
  customItems: CustomCostItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Step4FormProps {
  analysisId: string;
  /** Previously saved data from DB — source of truth on reload. */
  initialData?: Partial<Step4Data> | null;
  /** Purchase price in cents from Step 3 — used for live EUR calculations. */
  purchasePriceCents: number;
  /** Called on every change so the parent Shell can update the summary card. */
  onLiveDataChange?: (data: Step4LiveData) => void;
}

/**
 * Step 4 — "Kaufnebenkosten" form.
 *
 * @remarks
 * Two sections:
 * 1. Standard Nebenkosten — broker %, notary %, land registry %, transfer tax (Bundesland select)
 * 2. Weitere Nebenkosten — dynamic repeater of custom line items
 *
 * Each percentage field shows the calculated EUR amount below it in real-time.
 * The right sidebar (Step4InvestmentSummaryCard) receives live data via
 * `onLiveDataChange` from the Step4Shell.
 *
 * See SPEC-WIZARD-STEP4 v1.0.0.
 */
export function Step4Form({
  analysisId,
  initialData,
  purchasePriceCents,
  onLiveDataChange,
}: Step4FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setStep4 = useAnalysisStore((s) => s.setStep4);
  const setCurrentStep = useAnalysisStore((s) => s.setCurrentStep);
  const saved = useAnalysisStore((s) => s.step4);

  // Field state — DB > Zustand > defaults
  const [brokerFee, setBrokerFee] = useState(
    (initialData?.broker_fee_percent ?? saved.broker_fee_percent ?? WIZARD_DEFAULTS.brokerFeePercent).toString()
  );
  const [notaryFee, setNotaryFee] = useState(
    (initialData?.notary_fee_percent ?? saved.notary_fee_percent ?? WIZARD_DEFAULTS.notaryFeePercent).toString()
  );
  const [landRegistryFee, setLandRegistryFee] = useState(
    (initialData?.land_registry_fee_percent ?? saved.land_registry_fee_percent ?? WIZARD_DEFAULTS.landRegistryFeePercent).toString()
  );
  const [bundesland, setBundesland] = useState<Bundesland>(
    initialData?.bundesland ?? saved.bundesland ?? WIZARD_DEFAULTS.defaultBundesland
  );
  const [customItems, setCustomItems] = useState<CustomCostItem[]>(
    initialData?.custom_items ?? saved.custom_items ?? []
  );
  const [error, setError] = useState<string | null>(null);

  // Derived floats (NaN-safe)
  const brokerPct = parseFloat(brokerFee) || 0;
  const notaryPct = parseFloat(notaryFee) || 0;
  const landRegPct = parseFloat(landRegistryFee) || 0;
  const transferTaxPercent = BUNDESLAND_TAX_RATES[bundesland];

  /** Notify the parent Shell of live data changes for the summary card. */
  const notifyParent = useCallback(
    (
      broker: number,
      notary: number,
      landReg: number,
      bl: Bundesland,
      items: CustomCostItem[]
    ) => {
      onLiveDataChange?.({
        purchasePriceCents,
        brokerFeePercent: broker,
        notaryFeePercent: notary,
        landRegistryFeePercent: landReg,
        bundesland: bl,
        customItems: items,
      });
    },
    [onLiveDataChange, purchasePriceCents]
  );

  function handleBrokerChange(v: string) {
    setBrokerFee(v);
    notifyParent(parseFloat(v) || 0, notaryPct, landRegPct, bundesland, customItems);
  }
  function handleNotaryChange(v: string) {
    setNotaryFee(v);
    notifyParent(brokerPct, parseFloat(v) || 0, landRegPct, bundesland, customItems);
  }
  function handleLandRegChange(v: string) {
    setLandRegistryFee(v);
    notifyParent(brokerPct, notaryPct, parseFloat(v) || 0, bundesland, customItems);
  }
  function handleBundeslandChange(bl: Bundesland) {
    setBundesland(bl);
    notifyParent(brokerPct, notaryPct, landRegPct, bl, customItems);
  }

  // Custom items CRUD
  function addCustomItem() {
    const next = [...customItems, { label: "", amount_cents: 0 }];
    setCustomItems(next);
    notifyParent(brokerPct, notaryPct, landRegPct, bundesland, next);
  }
  function removeCustomItem(idx: number) {
    const next = customItems.filter((_, i) => i !== idx);
    setCustomItems(next);
    notifyParent(brokerPct, notaryPct, landRegPct, bundesland, next);
  }
  function updateCustomItem(idx: number, patch: Partial<CustomCostItem>) {
    const next = customItems.map((item, i) =>
      i === idx ? { ...item, ...patch } : item
    );
    setCustomItems(next);
    notifyParent(brokerPct, notaryPct, landRegPct, bundesland, next);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Filter out empty custom items before saving
    const validItems = customItems.filter(
      (item) => item.label.trim() !== "" && item.amount_cents > 0
    );

    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 4,
        data: {
          broker_fee_percent: brokerPct,
          notary_fee_percent: notaryPct,
          land_registry_fee_percent: landRegPct,
          bundesland,
          custom_items: validItems,
        },
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setStep4({
        broker_fee_percent: brokerPct,
        notary_fee_percent: notaryPct,
        land_registry_fee_percent: landRegPct,
        bundesland,
        custom_items: validItems,
      });
      setCurrentStep(5);
      router.push(`/analysis/${analysisId}/step/5`);
    });
  }

  return (
    <form id="step-4-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 sm:p-8 flex flex-col gap-8">

        {/* 1. Standard Nebenkosten */}
        <div className="flex flex-col gap-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Standard Nebenkosten
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Maklerprovision */}
            <PercentField
              id="step4-broker"
              label="Maklerprovision"
              value={brokerFee}
              onChange={handleBrokerChange}
              eurAmount={applyPercent(purchasePriceCents, brokerPct)}
              disabled={isPending}
            />

            {/* Notarkosten */}
            <PercentField
              id="step4-notary"
              label="Notarkosten"
              value={notaryFee}
              onChange={handleNotaryChange}
              eurAmount={applyPercent(purchasePriceCents, notaryPct)}
              disabled={isPending}
            />

            {/* Grundbucheintrag */}
            <PercentField
              id="step4-land-registry"
              label="Grundbucheintrag"
              value={landRegistryFee}
              onChange={handleLandRegChange}
              eurAmount={applyPercent(purchasePriceCents, landRegPct)}
              disabled={isPending}
            />

            {/* Grunderwerbsteuer — spans both columns to fit the long state names */}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="step4-bundesland" className="text-sm font-medium text-slate-700">
                Grunderwerbsteuer (Bundesland)
              </Label>
              <div className="relative">
                <select
                  id="step4-bundesland"
                  value={bundesland}
                  onChange={(e) => handleBundeslandChange(e.target.value as Bundesland)}
                  disabled={isPending}
                  className={cn(
                    "w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50",
                    "text-slate-900 text-base appearance-none",
                    "focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 focus:bg-white",
                    "transition-all disabled:opacity-50"
                  )}
                >
                  {BUNDESLAND_OPTIONS.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label} ({BUNDESLAND_TAX_RATES[key].toFixed(1).replace(".", ",")}%)
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <span className="text-xs text-slate-400 text-right">
                {formatCentsPlain(applyPercent(purchasePriceCents, transferTaxPercent))}&thinsp;€
              </span>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* 2. Weitere Nebenkosten — repeater */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Weitere Nebenkosten
            </h3>
            <button
              type="button"
              onClick={addCustomItem}
              disabled={isPending || customItems.length >= 20}
              className={cn(
                "text-sm font-medium text-navy-600 hover:text-navy-700",
                "flex items-center gap-1.5 transition-colors",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              Position hinzufügen
            </button>
          </div>

          {customItems.length === 0 && (
            <p className="text-sm text-slate-400 italic">
              Keine weiteren Positionen. Klicke auf &bdquo;Position hinzuf&uuml;gen&ldquo;.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {customItems.map((item, idx) => (
              <CustomItemRow
                key={idx}
                item={item}
                onChange={(patch) => updateCustomItem(idx, patch)}
                onRemove={() => removeCustomItem(idx)}
                disabled={isPending}
              />
            ))}
          </div>
        </div>

        <HelpAccordion triggerLabel="Warum brauchen wir diese Daten?">
          <p>
            Die <strong>Kaufnebenkosten</strong> erhöhen dein effektives
            Gesamtinvestment erheblich — in Deutschland typischerweise um
            9&ndash;15&nbsp;%. Sie beeinflussen das benötigte{" "}
            <strong>Eigenkapital</strong> und reduzieren die Rendite auf das
            eingesetzte Kapital (ROI). Durch die Eingabe aller Positionen
            erhältst du ein realistisches Bild deiner tatsächlichen
            Investitionskosten.
          </p>
        </HelpAccordion>
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <StepFooter
        showBack
        onBack={() => router.push(`/analysis/${analysisId}/step/3`)}
        isPending={isPending}
        primaryLabel="Weiter zu Sanierungsmaßnahmen"
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PercentFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  eurAmount: number;
  disabled?: boolean;
}

/** Reusable percentage input with live EUR amount hint below. */
function PercentField({ id, label, value, onChange, eurAmount, disabled }: PercentFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </Label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={0}
          max={20}
          step={0.01}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50",
            "text-slate-900 text-base text-right",
            "focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 focus:bg-white",
            "transition-all disabled:opacity-50"
          )}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <span className="text-slate-500 font-medium text-sm">%</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 text-right tabular-nums">
        {eurAmount > 0 ? `${formatCentsPlain(eurAmount)}\u202f€` : "—"}
      </span>
    </div>
  );
}

interface CustomItemRowProps {
  item: CustomCostItem;
  onChange: (patch: Partial<CustomCostItem>) => void;
  onRemove: () => void;
  disabled?: boolean;
}

/** Single row in the custom cost repeater. */
function CustomItemRow({ item, onChange, onRemove, disabled }: CustomItemRowProps) {
  const amountDisplay = item.amount_cents > 0 ? (item.amount_cents / 100).toString() : "";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Bezeichnung (z. B. Gutachter)"
          value={item.label}
          onChange={(e) => onChange({ label: e.target.value })}
          disabled={disabled}
          maxLength={100}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white",
            "text-slate-900 text-sm",
            "focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20",
            "transition-all disabled:opacity-50"
          )}
        />
      </div>
      <div className="w-32 relative flex-shrink-0">
        <input
          type="number"
          min={0}
          step={1}
          placeholder="0"
          value={amountDisplay}
          onChange={(e) => {
            const cents = Math.round(parseFloat(e.target.value) * 100) || 0;
            onChange({ amount_cents: cents });
          }}
          disabled={disabled}
          className={cn(
            "w-full pl-3 pr-8 py-2.5 rounded-lg border border-slate-200 bg-white",
            "text-slate-900 text-sm text-right",
            "focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20",
            "transition-all disabled:opacity-50"
          )}
        />
        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-sm pointer-events-none">
          €
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Position entfernen"
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-md flex-shrink-0",
          "text-slate-400 hover:text-red-500 hover:bg-red-50",
          "transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Investment Summary Card — rendered in the right sidebar
// ---------------------------------------------------------------------------

interface InvestmentSummaryCardProps {
  data: Step4LiveData;
}

/**
 * Receipt-style investment summary sidebar card for Step 4.
 *
 * @remarks
 * Shows Kaufpreis + itemised ancillary costs + Summe Nebenkosten +
 * Nebenkostenquote + total investment highlight.
 * All numbers update reactively as the user types.
 */
export function Step4InvestmentSummaryCard({ data }: InvestmentSummaryCardProps) {
  const {
    purchasePriceCents,
    brokerFeePercent,
    notaryFeePercent,
    landRegistryFeePercent,
    bundesland,
    customItems,
  } = data;

  const {
    brokerCents,
    notaryCents,
    landRegistryCents,
    transferTaxCents,
    transferTaxPercent,
    totalAncillaryCents,
    totalInvestmentCents,
    ancillaryRatePercent,
  } = computeAncillaryCosts(
    purchasePriceCents,
    brokerFeePercent,
    notaryFeePercent,
    landRegistryFeePercent,
    bundesland,
    customItems
  );


  return (
    <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
        Investitions-Zusammenfassung
      </h3>

      <div className="flex flex-col gap-2 font-mono text-xs">
        {/* Base price */}
        <div className="flex justify-between items-center text-slate-600 gap-2">
          <span className="whitespace-nowrap">Kaufpreis</span>
          <span className="font-semibold text-slate-900 tabular-nums">
            {purchasePriceCents > 0 ? `${formatCentsPlain(purchasePriceCents)}\u202f€` : "—"}
          </span>
        </div>

        <div className="border-t border-dashed border-slate-200 my-0.5" />

        {/* Standard items */}
        <SummaryRow
          label={`Makler (${brokerFeePercent.toFixed(2).replace(".", ",")}%)`}
          cents={brokerCents}
          show={purchasePriceCents > 0}
        />
        <SummaryRow
          label={`Notar (${notaryFeePercent.toFixed(2).replace(".", ",")}%)`}
          cents={notaryCents}
          show={purchasePriceCents > 0}
        />
        <SummaryRow
          label={`Grundbuch (${landRegistryFeePercent.toFixed(2).replace(".", ",")}%)`}
          cents={landRegistryCents}
          show={purchasePriceCents > 0}
        />
        <SummaryRow
          label={`Grunderwerb (${transferTaxPercent.toFixed(1).replace(".", ",")}%)`}
          cents={transferTaxCents}
          show={purchasePriceCents > 0}
        />

        {/* Custom items */}
        {customItems
          .filter((i) => i.amount_cents > 0 && i.label.trim())
          .map((item, idx) => (
            <SummaryRow
              key={idx}
              label={item.label.length > 14 ? item.label.slice(0, 13) + "…" : item.label}
              cents={item.amount_cents}
              show
            />
          ))}

        <div className="border-t border-dashed border-slate-200 my-0.5" />

        {/* Subtotal ancillary */}
        <div className="flex justify-between items-center text-slate-700 font-semibold gap-2">
          <span className="whitespace-nowrap">Nebenkosten</span>
          <span className="tabular-nums">
            {purchasePriceCents > 0 ? `${formatCentsPlain(totalAncillaryCents)}\u202f€` : "—"}
          </span>
        </div>
        {purchasePriceCents > 0 && (
          <div className="flex justify-between items-center text-slate-400 text-xs -mt-0.5 gap-2">
            <span className="whitespace-nowrap">Nebenkostenquote</span>
            <span className="tabular-nums">
              {ancillaryRatePercent.toFixed(2).replace(".", ",")}&thinsp;%
            </span>
          </div>
        )}
      </div>

      {/* Total highlight */}
      <div className="mt-6 p-4 rounded-xl bg-navy-50 border border-navy-100 flex flex-col gap-1">
        <span className="text-xs font-semibold text-navy-800 uppercase tracking-wider">
          Effektives Gesamtinvestment
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-navy-900 tracking-tight tabular-nums">
            {purchasePriceCents > 0 ? formatCentsPlain(totalInvestmentCents) : "—"}
          </span>
          {purchasePriceCents > 0 && (
            <span className="text-base font-semibold text-navy-700">€</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  cents: number;
  show: boolean;
}

function SummaryRow({ label, cents, show }: SummaryRowProps) {
  return (
    <div className="flex justify-between items-center text-slate-500 gap-2">
      <span className="truncate">{label}</span>
      <span className="tabular-nums whitespace-nowrap flex-shrink-0">
        {show ? `${formatCentsPlain(cents)}\u202f€` : "—"}
      </span>
    </div>
  );
}
