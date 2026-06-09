"use client";

import { useTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysisStore } from "@/stores/analysis-store";
import { saveStepAction } from "@/actions/analysis";
import { StepFooter } from "@/components/wizard/StepFooter";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Home,
  ReceiptText,
  Tags,
  ChevronDown,
  Wrench,
  Scissors,
  Car,
  Paperclip,
  Laptop,
  Phone,
  Scale,
  Plus,
  Trash2,
  Info,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCentsEur } from "@/domain/calculations/currency";
import { computePropertyNuancesBreakdown } from "@/domain/calculations/property-nuances";
import { SPECIAL_DEDUCTION_PRESETS } from "@/config/wizard-defaults";
import type { CostAllocationType, SpecialDeductionItem } from "@/domain/types/wizard";

// ── Preset icon resolver ────────────────────────────────────────────────────
const PRESET_ICONS: Record<string, React.ReactNode> = {
  Car: <Car className="w-4 h-4" />,
  Paperclip: <Paperclip className="w-4 h-4" />,
  Laptop: <Laptop className="w-4 h-4" />,
  Phone: <Phone className="w-4 h-4" />,
  Scale: <Scale className="w-4 h-4" />,
};

// ── Accordion sub-component ─────────────────────────────────────────────────
interface AccordionCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionCard({
  icon,
  title,
  subtitle,
  children,
  defaultOpen = true,
}: AccordionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-6 sm:p-8 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-600/20"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 font-normal mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 p-6 sm:p-8 pt-0 mt-0">
          <div className="mt-6">{children}</div>
        </div>
      )}
    </div>
  );
}

// ── Toggle row sub-component ────────────────────────────────────────────────
interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
      <div className="flex-1 pr-4">
        <Label
          htmlFor={id}
          className="block text-sm font-semibold text-slate-900 cursor-pointer"
        >
          {label}
        </Label>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface Step12FormProps {
  analysisId: string;
  /** Living area from Step 2, in m². Used to compute annual maintenance costs. */
  livingAreaSqm: number;
}

/**
 * Step 12 — Objektspezifische Nuancen.
 *
 * @remarks
 * Three accordion sections capture rental type, cost allocation detail,
 * and optional tax deductions. A live dark KPI sidebar shows Betriebskosten
 * p.a. and Sonderabzüge Gesamt as the user edits the form.
 *
 * The special-deduction repeater follows the same pattern as the Step 4
 * custom-cost-item repeater, with a max of 20 items (AC-5).
 *
 * See SPEC-WIZARD-STEP12 v1.0.0.
 */
export function Step12Form({ analysisId, livingAreaSqm }: Step12FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  const data = useAnalysisStore((state) => state.step12);
  const updateData = useAnalysisStore((state) => state.setStep12);

  // ── Resolved field values (with defaults) ──────────────────────────────────
  const isFurnished = data.is_furnished ?? false;
  const isShortTermRental = data.is_short_term_rental ?? false;
  const costAllocationType: CostAllocationType =
    data.cost_allocation_type ?? "nicht_umlegbar";
  const nonRecoverableCents =
    data.non_recoverable_costs_per_month_cents ?? 3500;
  const maintenancePerSqm = data.maintenance_per_sqm_euro ?? 1.5;

  /**
   * Stabilise the deductions array reference so the downstream useMemo
   * that computes KPIs does not re-run on every render.
   * The data slice from Zustand can produce a new array reference even
   * when the contents are unchanged, triggering the exhaustive-deps warning.
   */
  const specialDeductions: SpecialDeductionItem[] = useMemo(
    () => data.special_deductions ?? [],
     
    [data.special_deductions]
  );

  // ── Live KPI calculations ──────────────────────────────────────────────────
  const { annualOperatingCostsCents, totalSpecialDeductionsCents } = useMemo(
    () =>
      computePropertyNuancesBreakdown(
        nonRecoverableCents,
        maintenancePerSqm,
        livingAreaSqm,
        specialDeductions
      ),
    [nonRecoverableCents, maintenancePerSqm, livingAreaSqm, specialDeductions]
  );

  // ── Deduction repeater helpers ─────────────────────────────────────────────
  const addDeduction = (label: string = "") => {
    if (specialDeductions.length >= 20) return;
    const newItem: SpecialDeductionItem = {
      id: crypto.randomUUID(),
      label,
      amount_per_year_cents: 0,
    };
    updateData({ special_deductions: [...specialDeductions, newItem] });
  };

  const removeDeduction = (id: string) => {
    updateData({
      special_deductions: specialDeductions.filter((item) => item.id !== id),
    });
  };

  const updateDeductionLabel = (id: string, label: string) => {
    updateData({
      special_deductions: specialDeductions.map((item) =>
        item.id === id ? { ...item, label } : item
      ),
    });
  };

  const updateDeductionAmount = (id: string, euros: number) => {
    const cents = Math.round(euros * 100);
    updateData({
      special_deductions: specialDeductions.map((item) =>
        item.id === id ? { ...item, amount_per_year_cents: cents } : item
      ),
    });
  };

  const isPresetAdded = (presetId: string) =>
    specialDeductions.some(
      (item) => item.label === SPECIAL_DEDUCTION_PRESETS.find((p) => p.id === presetId)?.label
    );

  const filteredPresets = SPECIAL_DEDUCTION_PRESETS.filter((preset) =>
    preset.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 12,
        data: {
          is_furnished: isFurnished,
          is_short_term_rental: isShortTermRental,
          cost_allocation_type: costAllocationType,
          non_recoverable_costs_per_month_cents: nonRecoverableCents,
          maintenance_per_sqm_euro: maintenancePerSqm,
          special_deductions: specialDeductions,
        },
      });

      if (result.success) {
        router.push(`/analysis/${analysisId}/step/13`);
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
      {/* ── Left Column: Input Forms ─────────────────────────────────────── */}
      <div className="w-full lg:w-7/12 flex flex-col gap-6">
        <div className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Objektspezifische Nuancen
          </h1>
          <p className="text-slate-500 text-base leading-relaxed">
            Erfasse spezielle steuerliche und kostenrelevante Details wie
            Vermietungsart, nicht umlagefähige Kosten und Instandhaltung.
          </p>
        </div>

        {/* Accordion 1 — Vermietungsart */}
        <AccordionCard
          id="rental-type"
          icon={<Home className="w-5 h-5" />}
          title="Vermietungsart"
          subtitle="Möbliert, Kurzzeit oder Standard"
          defaultOpen
        >
          <div className="flex flex-col gap-4">
            <ToggleRow
              id="furnished-toggle"
              label="Möblierte Vermietung"
              description="Erlaubt den Abzug von Möblierungsabschreibungen"
              checked={isFurnished}
              onCheckedChange={(checked) =>
                updateData({ is_furnished: checked })
              }
            />
            <ToggleRow
              id="short-term-toggle"
              label="Kurzzeitvermietung (Airbnb etc.)"
              description="Ggf. umsatzsteuerpflichtig, höhere Rendite aber mehr Aufwand"
              checked={isShortTermRental}
              onCheckedChange={(checked) =>
                updateData({ is_short_term_rental: checked })
              }
            />
          </div>
        </AccordionCard>

        {/* Accordion 2 — Kostenallokation */}
        <AccordionCard
          id="cost-allocation"
          icon={<ReceiptText className="w-5 h-5" />}
          title="Kostenallokation"
          subtitle="Nicht umlagefähige Kosten & Instandhaltung"
          defaultOpen
        >
          <div className="flex flex-col gap-6">
            {/* Cost allocation type selector */}
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">
                Umlagefähigkeit
              </Label>
              <Select
                value={costAllocationType}
                onValueChange={(val: CostAllocationType | null) => {
                  if (val) updateData({ cost_allocation_type: val });
                }}
              >
                <SelectTrigger
                  id="cost-allocation-select"
                  className="w-full h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-medium focus:ring-navy-500"
                >
                  <SelectValue placeholder="Kostenallokation wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voll_umlegbar">
                    Voll umlegbar (vollständig auf Mieter)
                  </SelectItem>
                  <SelectItem value="teilweise_umlegbar">
                    Teilweise umlegbar
                  </SelectItem>
                  <SelectItem value="nicht_umlegbar">
                    Nicht umlegbar (Eigentümer trägt Kosten)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Non-recoverable costs */}
              <div>
                <Label
                  htmlFor="non-recoverable-input"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Nicht umlagefähige Kosten
                </Label>
                <div className="relative">
                  <input
                    id="non-recoverable-input"
                    type="number"
                    min={0}
                    step={1}
                    value={Math.round(nonRecoverableCents / 100)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const euros = Math.max(0, Number(e.target.value));
                      updateData({
                        non_recoverable_costs_per_month_cents: Math.round(
                          euros * 100
                        ),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 pr-14 focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 transition-colors font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 font-medium pointer-events-none">
                    €/M
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Verwaltung, Instandhaltungsrücklage etc.
                </p>
              </div>

              {/* Maintenance per m² */}
              <div>
                <Label
                  htmlFor="maintenance-sqm-input"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Erwartete Instandhaltung
                </Label>
                <div className="relative">
                  <input
                    id="maintenance-sqm-input"
                    type="number"
                    min={0}
                    max={20}
                    step={0.1}
                    value={maintenancePerSqm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      let val = Number(e.target.value);
                      if (val < 0) val = 0;
                      if (val > 20) val = 20;
                      updateData({ maintenance_per_sqm_euro: val });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 pr-16 focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 transition-colors font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 font-medium pointer-events-none">
                    €/m²
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Monatliche Rücklage pro Quadratmeter
                </p>
              </div>
            </div>
          </div>
        </AccordionCard>

        {/* Accordion 3 — Sonderabzüge */}
        <AccordionCard
          id="special-deductions"
          icon={<Tags className="w-5 h-5" />}
          title="Sonderabzüge (Optional)"
          subtitle="Individuelle steuerliche Abzüge hinzufügen"
          defaultOpen
        >
          <div className="flex flex-col gap-6">
            {/* Quick-add presets */}
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-3">
                Häufige Abzüge schnell hinzufügen
              </Label>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Search */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Abzüge suchen..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchQuery(e.target.value)
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-slate-300 text-slate-600"
                    />
                  </div>
                </div>

                {/* Preset list */}
                <div className="flex flex-col py-1">
                  {filteredPresets.length === 0 && (
                    <p className="px-4 py-3 text-sm text-slate-400 italic">
                      Keine Treffer
                    </p>
                  )}
                  {filteredPresets.map((preset) => {
                    const added = isPresetAdded(preset.id);
                    return (
                      <div
                        key={preset.id}
                        className={cn(
                          "px-4 py-2.5 flex items-center gap-3 transition-colors",
                          added ? "bg-slate-50/50" : "hover:bg-slate-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 flex justify-center",
                            added ? "text-slate-600" : "text-slate-400"
                          )}
                        >
                          {PRESET_ICONS[preset.icon]}
                        </div>
                        <span
                          className={cn(
                            "text-sm flex-1",
                            added
                              ? "text-slate-900 font-medium"
                              : "text-slate-600"
                          )}
                        >
                          {preset.label}
                        </span>
                        {added ? (
                          <span className="text-xs font-medium text-slate-400 px-2.5 py-1">
                            Hinzugefügt
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addDeduction(preset.label)}
                            disabled={specialDeductions.length >= 20}
                            className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Hinzufügen
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Custom deduction rows */}
            <div className="flex flex-col gap-4">
              {specialDeductions.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  {/* Label */}
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Bezeichnung (z.B. Fahrtkosten)"
                      value={item.label}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateDeductionLabel(item.id, e.target.value)
                      }
                      maxLength={100}
                      aria-label="Bezeichnung des Sonderabzugs"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 transition-colors text-sm"
                    />
                  </div>
                  {/* Amount */}
                  <div className="w-full sm:w-44 relative">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={
                        item.amount_per_year_cents === 0
                          ? ""
                          : item.amount_per_year_cents / 100
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateDeductionAmount(
                          item.id,
                          Math.max(0, Number(e.target.value))
                        )
                      }
                      aria-label="Jährlicher Betrag in Euro"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 transition-colors text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 text-sm pointer-events-none">
                      €/J
                    </div>
                  </div>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeDeduction(item.id)}
                    aria-label={`Abzug "${item.label}" entfernen`}
                    className="w-12 h-12 shrink-0 rounded-xl border border-slate-200 text-slate-400 hover:text-navy-600 hover:border-navy-200 hover:bg-navy-50 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add button */}
              {specialDeductions.length < 20 ? (
                <button
                  type="button"
                  onClick={() => addDeduction()}
                  className="mt-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-medium hover:border-navy-300 hover:text-navy-600 hover:bg-navy-50/50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Weiteren Abzug hinzufügen
                </button>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">
                  Maximale Anzahl erreicht (20)
                </p>
              )}
            </div>
          </div>
        </AccordionCard>

        <StepFooter
          onBack={() => router.push(`/analysis/${analysisId}/step/11`)}
          isPending={isPending}
          primaryLabel="Weiter zu Zinsen & Gebühren"
        />
      </div>

      {/* ── Right Column: Live KPI Sidebar ────────────────────────────────── */}
      <div className="w-full lg:w-5/12 flex flex-col">
        <div className="sticky top-24 flex flex-col gap-6">
          {/* Dark KPI widget */}
          <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-1 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-navy-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <h3 className="text-white font-semibold">Kosten & Abzüge</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Betriebskosten */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1">
                      Betriebskosten (p.a.)
                    </span>
                    <span className="text-white text-xl font-bold">
                      {formatCentsEur(annualOperatingCostsCents)}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                </div>

                {/* Sonderabzüge */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1">
                      Sonderabzüge Gesamt
                    </span>
                    <span className="text-white text-xl font-bold">
                      {formatCentsEur(totalSpecialDeductionsCents)}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Scissors className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Breakdown detail */}
              {livingAreaSqm > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                    Aufschlüsselung
                  </p>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">
                      Nicht umlagefähig ({Math.round(nonRecoverableCents / 100)}&thinsp;€/M)
                    </span>
                    <span className="text-slate-300 font-medium">
                      {formatCentsEur(nonRecoverableCents * 12)}&thinsp;/J
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">
                      Instandhaltung ({maintenancePerSqm}&thinsp;€/m²)
                    </span>
                    <span className="text-slate-300 font-medium">
                      {formatCentsEur(
                        Math.round(maintenancePerSqm * livingAreaSqm * 12 * 100)
                      )}&thinsp;/J
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info callout */}
          <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 flex items-start gap-4">
            <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 leading-relaxed">
              Nicht umlagefähige Kosten mindern deinen Cashflow direkt.
              Sonderabzüge können jedoch deine Steuerlast senken. Achte darauf,
              alle relevanten Positionen zu erfassen.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
