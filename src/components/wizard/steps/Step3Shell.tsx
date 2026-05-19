"use client";

import { useState } from "react";
import { Step3Form, Step3KpiPreviewCard } from "./Step3Form";
import { KpiSidebarPlaceholder } from "@/components/wizard/KpiSidebarPlaceholder";
import { Percent, TrendingUp, Landmark } from "lucide-react";
import type { Step3Data } from "@/domain/types/wizard";

interface Step3ShellProps {
  analysisId: string;
  initialData?: Partial<Step3Data> | null;
}

/**
 * Step 3 shell — Client Component that owns the shared live-preview state.
 *
 * @remarks
 * Both `Step3Form` and `Step3KpiPreviewCard` need to react to the same
 * typed values (purchase price, cold rent, vacancy rate). Lifting that
 * state here — rather than keeping it only inside `Step3Form` — enables
 * the right-sidebar KPI card to update in real-time as the user types,
 * without a page reload or server round-trip.
 *
 * The page (`app/.../[step]/page.tsx`) renders this shell instead of
 * the two components separately.
 */
export function Step3Shell({ analysisId, initialData }: Step3ShellProps) {
  // Shared live-preview state — initialised from DB data (reload-safe)
  const [purchaseDisplay, setPurchaseDisplay] = useState(
    initialData?.purchase_price_cents
      ? new Intl.NumberFormat("de-DE").format(
          initialData.purchase_price_cents / 100
        )
      : ""
  );
  const [coldRentDisplay, setColdRentDisplay] = useState(
    initialData?.cold_rent_cents
      ? new Intl.NumberFormat("de-DE").format(
          initialData.cold_rent_cents / 100
        )
      : ""
  );
  const [vacancyRate, setVacancyRate] = useState(
    initialData?.vacancy_rate_percent ?? 2
  );

  return (
    <div className="flex gap-8 items-start justify-center w-full">
      {/* Left KPI sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0 opacity-50 sticky top-6">
        <KpiSidebarPlaceholder
          label="Eigenkapitalrendite"
          helperText="Benötigt Finanzierungsdaten"
          icon={<Percent className="w-10 h-10" />}
        />
        <KpiSidebarPlaceholder
          label="Cashflow"
          helperText="Wird nach Schritt 6 berechnet"
          icon={<TrendingUp className="w-10 h-10" />}
        />
      </aside>

      {/* Center: form */}
      <section className="flex-1 min-w-0 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kaufpreis &amp; Miete
          </h1>
          <p className="text-slate-500 mt-2">
            Trage den Kaufpreis und die erwarteten Mieteinnahmen ein, um
            die erste Rendite-Indikation zu erhalten.
          </p>
        </div>
        <Step3Form
          analysisId={analysisId}
          initialData={initialData}
          onPurchaseChange={setPurchaseDisplay}
          onColdRentChange={setColdRentDisplay}
          onVacancyChange={setVacancyRate}
        />
      </section>

      {/* Right sidebar: live KPI preview — updates in real-time */}
      <aside className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0 sticky top-6">
        <Step3KpiPreviewCard
          purchaseDisplayValue={purchaseDisplay}
          coldRentDisplayValue={coldRentDisplay}
          vacancyRate={vacancyRate}
        />
        <KpiSidebarPlaceholder
          label="Kaufnebenkosten"
          helperText="Nächster Schritt: Notar &amp; Steuer"
          icon={<Landmark className="w-10 h-10" />}
        />
      </aside>
    </div>
  );
}
