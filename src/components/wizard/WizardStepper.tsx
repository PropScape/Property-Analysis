"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { WIZARD_STEP_LABELS, WIZARD_STEP_COUNT } from "./wizard-constants";

interface WizardStepperProps {
  /** 1-indexed current step (1–16). */
  currentStep: number;
  /** Optional additional class names. */
  className?: string;
}

/**
 * Horizontal progress stepper for the 16-step analysis wizard.
 *
 * @remarks
 * Three states per node:
 * - **Completed** (`step < currentStep`): slate-800 fill, white check icon.
 * - **Active** (`step === currentStep`): navy-600 fill + glow ring, white number.
 * - **Upcoming** (`step > currentStep`): white fill, slate-200 border, slate-400 number.
 *
 * **Label strategy:** Labels are absolutely positioned below each circle,
 * entirely out of the normal flow — zero impact on circle alignment.
 * On desktop they fade in on `group-hover` (pure CSS, no JS).
 * On mobile (touch) hover never fires → labels stay hidden.
 * A proper mobile step-selector (e.g. dropdown) will be implemented in a
 * future spec when the full wizard navigation is built.
 *
 * `pb-6` on the `<ol>` reserves vertical space so the absolutely-positioned
 * labels don't clip against the header's bottom edge.
 *
 * See design-system.md §7.2 (WizardStepper) and §9 (interactive states).
 */
export function WizardStepper({ currentStep, className }: WizardStepperProps) {
  return (
    <nav
      aria-label="Wizard-Fortschritt"
      className={cn("w-full overflow-x-auto", className)}
    >
      <ol className="flex items-center min-w-max px-2 py-1 pb-6">
        {Array.from({ length: WIZARD_STEP_COUNT }, (_, i) => i + 1).map(
          (step) => {
            const isCompleted = step < currentStep;
            const isActive = step === currentStep;
            const isFirst = step === 1;

            return (
              <li key={step} className="flex items-center">
                {/* Connector line — skip for step 1 */}
                {!isFirst && (
                  <div
                    className={cn(
                      "h-px w-5 flex-shrink-0 transition-colors duration-300",
                      step - 1 < currentStep
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Circle + label — wrapper is the positioning context */}
                <div className="relative group flex-shrink-0">
                  {/* Circle */}
                  <div
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center",
                      "text-xs font-semibold transition-all duration-200 ease-in-out",
                      isCompleted && "bg-slate-800 text-white",
                      isActive &&
                        "bg-navy-600 text-white shadow-[0_0_0_3px_rgba(30,58,138,0.2)]",
                      !isCompleted &&
                        !isActive &&
                        "bg-white border border-slate-200 text-slate-400"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3" aria-hidden="true" />
                    ) : (
                      <span>{step}</span>
                    )}
                  </div>

                  {/* Label — centered below the circle wrapper */}
                  <span
                    className={cn(
                      "absolute top-full left-1/2 -translate-x-1/2 mt-1.5",
                      "whitespace-nowrap text-[9px] leading-none",
                      "opacity-0 group-hover:opacity-100",
                      "transition-opacity duration-150 ease-in-out",
                      "pointer-events-none select-none",
                      isActive && "text-navy-600 font-semibold",
                      isCompleted && !isActive && "text-slate-500",
                      !isCompleted && !isActive && "text-slate-400"
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
