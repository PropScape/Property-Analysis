"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
        // Glass panel sticky bar
        "sticky bottom-0 z-10",
        "bg-white/80 backdrop-blur-sm border-t border-slate-200",
        "px-4 py-3 sm:px-6 sm:py-4",
        className
      )}
    >
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        {/* Back button */}
        {showBack && onBack && (
          <Button
            id="wizard-step-back"
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isPending}
            className={cn(
              "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
              "transition-all duration-200 ease-in-out"
            )}
          >
            <ArrowLeft className="mr-1.5 w-4 h-4" aria-hidden="true" />
            Zurück
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Primary CTA */}
        <Button
          id="wizard-step-next"
          type="submit"
          disabled={isPending}
          className={cn(
            "bg-navy-600 text-white",
            "hover:bg-navy-700 hover:shadow-lg",
            "focus:ring-2 focus:ring-navy-600/20 focus:outline-none",
            "shadow-[0_0_20px_rgba(30,58,138,0.2)]",
            "transition-all duration-200 ease-in-out",
            "min-w-[120px]",
            isPending && "opacity-50 pointer-events-none"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 w-4 h-4 animate-spin" aria-hidden="true" />
              Speichern…
            </>
          ) : (
            <>
              {primaryLabel}
              <ArrowRight
                className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </>
          )}
        </Button>
      </div>
    </footer>
  );
}
