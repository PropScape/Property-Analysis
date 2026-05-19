"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createAnalysisAction } from "@/actions/analysis";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2 } from "lucide-react";

const initialState = null;

/**
 * Name-prompt form for creating a new analysis.
 *
 * @remarks
 * Uses `useActionState` (React 19 / Next.js 16) to wire the Server Action.
 * The DB record is only created on form submission — no orphan rows if the
 * user navigates away from this page without submitting.
 *
 * On success, `createAnalysisAction` calls `redirect()` internally, which
 * navigates the user to `/analysis/[id]/step/1`.
 *
 * See SPEC-WIZARD-START v1.0.0 AC-2, AC-3.
 */
export function NewAnalysisForm() {
  const [state, formAction, isPending] = useActionState(
    createAnalysisAction,
    initialState
  );

  const errorMessage =
    state !== null && !state.success ? state.error : undefined;

  return (
    <form
      id="new-analysis-form"
      action={formAction}
      className="flex flex-col gap-5"
      aria-describedby={errorMessage ? "new-analysis-error" : undefined}
    >
      {/* Name field */}
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="new-analysis-name"
          className="text-sm font-medium text-slate-700"
        >
          Name der Analyse{" "}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="new-analysis-name"
          name="name"
          type="text"
          required
          autoFocus
          maxLength={100}
          placeholder="z.B. Maisonette Berlin Prenzlauer Berg"
          disabled={isPending}
          className={cn(
            "rounded-lg border-slate-200",
            "focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600",
            "transition-all duration-200",
            errorMessage && "border-red-400 focus:ring-red-400/20 focus:border-red-400"
          )}
          aria-describedby={errorMessage ? "new-analysis-error" : undefined}
          aria-invalid={errorMessage ? "true" : undefined}
        />
        <p className="text-xs text-slate-400">
          Maximal 100 Zeichen. Sie können den Namen später ändern.
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <p
          id="new-analysis-error"
          role="alert"
          aria-live="polite"
          className="text-sm text-red-500"
        >
          {errorMessage}
        </p>
      )}

      {/* Submit */}
      <Button
        id="new-analysis-submit"
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full bg-navy-600 text-white",
          "hover:bg-navy-700 hover:shadow-lg",
          "focus:ring-2 focus:ring-navy-600/20 focus:outline-none",
          "shadow-[0_0_20px_rgba(30,58,138,0.2)]",
          "transition-all duration-200 ease-in-out",
          isPending && "opacity-50 pointer-events-none"
        )}
      >
        {isPending ? (
          <>
            <Loader2
              className="mr-2 w-4 h-4 animate-spin"
              aria-hidden="true"
            />
            Analyse wird erstellt…
          </>
        ) : (
          <>
            Analyse starten
            <ArrowRight
              className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </>
        )}
      </Button>
    </form>
  );
}
