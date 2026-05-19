"use client";

import { cn } from "@/lib/utils";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface StepFooterProps {
  /** Called when the user clicks the "Zurück" button. */
  onBack?: () => void;
  /** Text for the primary action button. Defaults to "Weiter". */
  primaryLabel?: string;
  /** Disables the primary CTA (e.g. while saving). */
  isPending?: boolean;
  /** Shows the back button (hidden on step 1). */
  showBack?: boolean;
  /** Optional additional class names. */
  className?: string;
}

/**
 * Fixed navigation footer for the wizard.
 *
 * @remarks
 * Layout:
 * - Desktop: back button on the left, primary CTA on the right.
 * - Mobile: CTA spans full width; back is a ghost button above it.
 *
 * The primary CTA is always `type="submit"` — it relies on the parent
 * `<form>` to invoke the Server Action / form submission logic.
 *
 * See design-system.md §7.2 (StepFooter), §9 (button states), §11 (animations).
 */
export function StepFooter({
  onBack,
  primaryLabel = "Weiter",
  isPending = false,
  showBack = true,
  className,
}: StepFooterProps) {
  return (
    <footer
      className={cn(
        "w-full flex items-center justify-between mt-8",
        className
      )}
    >

        {/* Back button */}
        {showBack && onBack && (
          <button
            id="wizard-step-back"
            type="button"
            onClick={onBack}
            disabled={isPending}
            className={cn(
              "px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium",
              "hover:bg-slate-50 hover:text-slate-900 transition-colors",
              "flex items-center gap-2",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Zurück
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Primary CTA */}
        <button
          id="wizard-step-next"
          type="submit"
          disabled={isPending}
          className={cn(
            "px-8 py-3 bg-navy-600 hover:bg-navy-700 text-white rounded-xl font-semibold",
            "shadow-[0_4px_14px_0_rgba(30,58,138,0.39)] hover:shadow-[0_6px_20px_rgba(30,58,138,0.23)]",
            "transition-all flex items-center gap-2 group",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Speichern…
            </>
          ) : (
            <>
              {primaryLabel}
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </>
          )}
        </button>
    </footer>
  );
}
