"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { WIZARD_STEP_LABELS, WIZARD_STEP_COUNT } from "./wizard-constants";

interface WizardStepperProps {
  /** Analysis ID — used to construct step navigation URLs. */
  analysisId: string;
  /** The furthest step the user has reached (derived from DB current_step). */
  furthestStep: number;
  /** Optional additional class names. */
  className?: string;
}

/**
 * Horizontal progress stepper for the 16-step analysis wizard.
 *
 * @remarks
 * Three states per node:
 * - **Completed** (`step < currentStep`): slate-800 fill, white check icon.
 * - **Active** (`step === currentStep`): navy-600 fill + glow ring, step number.
 * - **Upcoming** (`step > currentStep`): white fill, slate-200 border, slate-400 number.
 *
 * **Active step always shows its number, never the checkmark** — so navigating
 * back to a completed step still shows it as active (not done).
 *
 * **Step source:** `usePathname()` — self-contained, updates immediately on
 * every client-side navigation without any server round-trip or header
 * gymnastics. This is why the layout does NOT need to pass `currentStep`
 * as a prop. See ADR-007 and the x-pathname removal rationale.
 *
 * **Label strategy:** Labels are absolutely positioned below each circle,
 * entirely out of the normal flow — zero impact on circle alignment.
 * On desktop they fade in on `group-hover` (pure CSS, no JS).
 * On mobile (touch) hover never fires → labels stay hidden until a
 * dedicated mobile step-selector is built in a future spec.
 *
 * `pb-6` on the `<ol>` reserves vertical space so the absolutely-positioned
 * labels don't clip against the header's bottom edge.
 *
 * See design-system.md §7.2 (WizardStepper) and §9 (interactive states).
 */
export function WizardStepper({ analysisId, furthestStep, className }: WizardStepperProps) {
  const pathname = usePathname();

  // Derive active step from the current URL: /analysis/[id]/step/[n]
  const match = pathname.match(/\/step\/(\d+)/);
  const activeStep = match ? parseInt(match[1], 10) : 1;

  return (
    <nav
      aria-label="Wizard-Fortschritt"
      className={cn("w-full overflow-x-auto text-center", className)}
    >
      <ol className="inline-flex items-center min-w-max px-2 py-1 pb-6 text-left">
        {Array.from({ length: WIZARD_STEP_COUNT }, (_, i) => i + 1).map(
          (step) => {
            // A step is considered unlocked (completed) if it's <= the furthest step reached.
            const isUnlocked = step <= furthestStep;
            const isActive = step === activeStep;
            const isFirst = step === 1;

            return (
              <li key={step} className="flex items-center">
                {/* Connector line — skip for step 1 */}
                {!isFirst && (
                  <div
                    className={cn(
                      "h-px w-5 flex-shrink-0 transition-colors duration-300",
                      step <= furthestStep
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Circle + label — completed steps are clickable links */}
                <div className="relative group flex-shrink-0">
                  {isActive ? (
                    <div
                      aria-current="step"
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        "text-xs font-semibold transition-all duration-200 ease-in-out",
                        "bg-navy-600 text-white shadow-[0_0_0_3px_rgba(30,58,138,0.2)]"
                      )}
                    >
                      <span>{step}</span>
                    </div>
                  ) : isUnlocked ? (
                    <Link
                      href={`/analysis/${analysisId}/step/${step}`}
                      aria-label={`Zu Schritt ${step}: ${WIZARD_STEP_LABELS[step]}`}
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        "text-xs font-semibold transition-all duration-200 ease-in-out",
                        "bg-slate-800 text-white",
                        "hover:bg-navy-600 hover:shadow-[0_0_0_3px_rgba(30,58,138,0.2)]",
                        "cursor-pointer"
                      )}
                    >
                      <Check className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  ) : (
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        "text-xs font-semibold transition-all duration-200 ease-in-out",
                        "bg-white border border-slate-200 text-slate-400"
                      )}
                    >
                      <span>{step}</span>
                    </div>
                  )}

                  {/* Label — centered below circle, hover-only on desktop */}
                  <span
                    className={cn(
                      "absolute top-full left-1/2 -translate-x-1/2 mt-1.5",
                      "whitespace-nowrap text-[9px] leading-none",
                      "opacity-0 group-hover:opacity-100",
                      "transition-opacity duration-150 ease-in-out",
                      "pointer-events-none select-none",
                      isActive && "text-navy-600 font-semibold",
                      isUnlocked && !isActive && "text-slate-500",
                      !isUnlocked && !isActive && "text-slate-400"
                    )}
                    aria-hidden="true"
                  >
                    {WIZARD_STEP_LABELS[step]}
                  </span>
                </div>
              </li>
            );
          }
        )}
      </ol>
    </nav>
  );
}
