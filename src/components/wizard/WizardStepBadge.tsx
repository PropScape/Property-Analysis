"use client";

import { usePathname } from "next/navigation";
import { WIZARD_STEP_LABELS, WIZARD_STEP_COUNT } from "./wizard-constants";

/**
 * Mobile step badge shown in the wizard header ("2 · Objekt / 16").
 *
 * @remarks
 * Uses `usePathname()` to always reflect the current page immediately on
 * every client-side navigation — no server round-trip required.
 *
 * Rendered as a `<span>` pair inside the existing header layout.
 * The badge is visible on all viewports (the parent hides it on lg+ if needed).
 *
 * See WizardStepper for the rationale of usePathname() over x-pathname headers.
 */
export function WizardStepBadge() {
  const pathname = usePathname();

  const match = pathname.match(/\/step\/(\d+)/);
  const currentStep = match ? parseInt(match[1], 10) : 1;
  const stepName = WIZARD_STEP_LABELS[currentStep] ?? `Schritt ${currentStep}`;

  return (
    <>
      <span className="text-xs text-slate-600 font-medium">
        {stepName}
      </span>
      <span className="text-xs text-slate-400">/ {WIZARD_STEP_COUNT}</span>
    </>
  );
}
