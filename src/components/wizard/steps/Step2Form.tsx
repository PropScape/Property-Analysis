"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCardGroup } from "@/components/wizard/RadioCardGroup";
import { SegmentedToggle } from "@/components/wizard/SegmentedToggle";
import { HelpAccordion } from "@/components/wizard/HelpAccordion";
import { StepFooter } from "@/components/wizard/StepFooter";
import { saveStepAction } from "@/actions/analysis";
import { useAnalysisStore } from "@/stores/analysis-store";
import { cn } from "@/lib/utils";
import type { PropertyType, OccupancyType, PropertyCondition, Step2Data } from "@/domain/types/wizard";
import { Building, Home, Building2, MapPin, Calendar, CalendarDays } from "lucide-react";

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

const PROPERTY_TYPE_OPTIONS = [
  {
    value: "wohnung" as PropertyType,
    label: "Wohnung",
    icon: <Building className="w-5 h-5" />,
  },
  {
    value: "haus" as PropertyType,
    label: "Haus",
    icon: <Home className="w-5 h-5" />,
  },
  {
    value: "mfh" as PropertyType,
    label: "Mehrfamilienhaus",
    icon: <Building2 className="w-5 h-5" />,
  },
];

const OCCUPANCY_OPTIONS = [
  { value: "vermietet" as OccupancyType, label: "Vermietet" },
  { value: "leerstehend" as OccupancyType, label: "Leerstehend" },
  { value: "eigennutzung" as OccupancyType, label: "Eigennutzung" },
];

const CONDITION_OPTIONS: { value: PropertyCondition; label: string }[] = [
  { value: "neubau", label: "Neubau / Erstbezug" },
  { value: "saniert", label: "Vollständig saniert" },
  { value: "gepflegt", label: "Gepflegt (kein Sanierungsstau)" },
  { value: "renovierungsbeduerftig", label: "Renovierungsbedürftig" },
  { value: "sanierungsbeduerftig", label: "Sanierungsbedürftig" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Step2FormProps {
  analysisId: string;
  /**
   * Previously saved step data loaded from the DB by the Server Component.
   * Takes priority over the Zustand store on initial render so fields are
   * populated after a page reload (DB = source of truth).
   */
  initialData?: Partial<Step2Data> | null;
}

/**
 * Step 2 — "Allgemeine Objektdaten" form.
 *
 * @remarks
 * Sections (mirrors HTML mockup exactly):
 * 1. Property type RadioCardGroup (Wohnung / Haus / MFH)
 * 2. Core data grid: Standort · Wohnfläche · Baujahr · Kaufdatum
 * 3. Nutzungsart SegmentedToggle + Zustand Select
 * 4. HelpAccordion: "Warum brauchen wir diese Daten?"
 *
 * On submit: calls `saveStepAction`, updates Zustand, navigates to step 3.
 *
 * See SPEC-WIZARD-STEP2 v1.0.0.
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/functions/use-router} useRouter
 */
export function Step2Form({ analysisId, initialData }: Step2FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setStep2 = useAnalysisStore((s) => s.setStep2);
  const setCurrentStep = useAnalysisStore((s) => s.setCurrentStep);
  const saved = useAnalysisStore((s) => s.step2);

  // DB data (initialData) takes priority over the Zustand store on mount.
  // This ensures fields are pre-filled after a reload even if localStorage
  // was cleared or the user opens the link on another device.
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>(
    (initialData?.property_type ?? saved.property_type) as PropertyType | undefined
  );
  const [location, setLocation] = useState(
    initialData?.location ?? saved.location ?? ""
  );
  const [livingArea, setLivingArea] = useState(
    (initialData?.living_area_sqm ?? saved.living_area_sqm)?.toString() ?? ""
  );
  const [yearBuilt, setYearBuilt] = useState(
    (initialData?.year_built ?? saved.year_built)?.toString() ?? ""
  );
  const [purchaseDate, setPurchaseDate] = useState(
    initialData?.purchase_date ?? saved.purchase_date ?? ""
  );
  const [occupancy, setOccupancy] = useState<OccupancyType | undefined>(
    (initialData?.occupancy_type ?? saved.occupancy_type) as OccupancyType | undefined
  );
  const [condition, setCondition] = useState<PropertyCondition | undefined>(
    (initialData?.condition ?? saved.condition) as PropertyCondition | undefined
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const livingAreaNum = parseFloat(livingArea);
    const yearBuiltNum = parseInt(yearBuilt, 10);

    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 2,
        data: {
          property_type: propertyType,
          location,
          living_area_sqm: livingAreaNum,
          year_built: yearBuiltNum,
          purchase_date: purchaseDate,
          occupancy_type: occupancy,
          condition,
        },
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Persist validated data to Zustand store
      if (propertyType && occupancy && condition) {
        setStep2({
          property_type: propertyType,
          location,
          living_area_sqm: livingAreaNum,
          year_built: yearBuiltNum,
          purchase_date: purchaseDate,
          occupancy_type: occupancy,
          condition,
        });
      }
      setCurrentStep(3);

      router.push(`/analysis/${analysisId}/step/3`);
    });
  }

  function handleBack() {
    router.push(`/analysis/${analysisId}/step/1`);
  }

  return (
    <form
      id="step-2-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
    >
      {/* White card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 sm:p-8 flex flex-col gap-8">

        {/* 1. Property type */}
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-semibold text-slate-900">
            Art der Immobilie{" "}
            <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <RadioCardGroup
            name="property_type"
            options={PROPERTY_TYPE_OPTIONS}
            value={propertyType}
            onChange={setPropertyType}
            label="Immobilienart"
          />
        </div>

        <hr className="border-slate-100" />

        {/* 2. Core data grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Standort */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="step2-location" className="text-sm font-semibold text-slate-900">
              Standort (PLZ / Ort){" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="step2-location"
                name="location"
                type="text"
                placeholder="z.B. 10115 Berlin"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isPending}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 transition-all"
              />
            </div>
          </div>

          {/* Wohnfläche */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="step2-living-area" className="text-sm font-semibold text-slate-900">
              Wohnfläche{" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <Input
                id="step2-living-area"
                name="living_area_sqm"
                type="number"
                placeholder="0"
                min={1}
                max={10000}
                step={0.01}
                value={livingArea}
                onChange={(e) => setLivingArea(e.target.value)}
                disabled={isPending}
                className="pr-12 text-right rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                m²
              </span>
            </div>
          </div>

          {/* Baujahr */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="step2-year-built" className="text-sm font-semibold text-slate-900">
              Baujahr{" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="step2-year-built"
                name="year_built"
                type="number"
                placeholder="JJJJ"
                min={1800}
                max={new Date().getFullYear() + 5}
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                disabled={isPending}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 transition-all"
              />
            </div>
          </div>

          {/* Kaufdatum */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="step2-purchase-date" className="text-sm font-semibold text-slate-900">
              Geplantes Kaufdatum{" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <CalendarDays
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="step2-purchase-date"
                name="purchase_date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={isPending}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 transition-all appearance-none"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* 3. Nutzungsart + Zustand */}
        <div className="flex flex-col gap-6">

          {/* Nutzungsart */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-semibold text-slate-900">
              Nutzungsart{" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <SegmentedToggle
              name="occupancy_type"
              options={OCCUPANCY_OPTIONS}
              value={occupancy}
              onChange={setOccupancy}
              label="Nutzungsart"
              className="w-full sm:w-fit"
            />
          </div>

          {/* Zustand */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="step2-condition" className="text-sm font-semibold text-slate-900">
              Zustand der Immobilie{" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <select
              id="step2-condition"
              value={condition ?? ""}
              onChange={(e) => setCondition(e.target.value as PropertyCondition)}
              disabled={isPending}
              className={cn(
                "w-full sm:w-1/2 px-4 py-3 rounded-xl",
                "border border-slate-200 bg-slate-50 text-slate-900",
                "focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600 focus:bg-white",
                "transition-all text-sm appearance-none cursor-pointer",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                !condition && "text-slate-400"
              )}
            >
              <option value="" disabled>Zustand wählen…</option>
              {CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Help accordion */}
        <HelpAccordion triggerLabel="Warum brauchen wir diese Daten?">
          <p>
            <strong>Baujahr</strong> und <strong>Wohnfläche</strong> beeinflussen
            maßgeblich die spätere <strong>Abschreibung (AfA)</strong> und
            mögliche Sanierungskosten. Der <strong>Standort</strong> gibt erste
            Indikationen für ortsübliche Mieten und
            Wertentwicklungspotenziale.
          </p>
        </HelpAccordion>
      </div>

      {/* Inline error */}
      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-red-500">
          {error}
        </p>
      )}

      {/* Footer navigation */}
      <StepFooter
        showBack
        onBack={handleBack}
        isPending={isPending}
        primaryLabel="Weiter zu Kaufpreis & Miete"
      />
    </form>
  );
}
