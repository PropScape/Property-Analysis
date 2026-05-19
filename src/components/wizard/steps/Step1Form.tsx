"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RadioCardGroup } from "@/components/wizard/RadioCardGroup";
import { StepFooter } from "@/components/wizard/StepFooter";
import { saveStepAction } from "@/actions/analysis";
import { useAnalysisStore } from "@/stores/analysis-store";
import type { WizardIntent, ExperienceLevel } from "@/domain/types/wizard";
import { Banknote, Home, TrendingUp, GraduationCap, Lightbulb, Briefcase } from "lucide-react";

// ---------------------------------------------------------------------------
// Option definitions
// ---------------------------------------------------------------------------

const INTENT_OPTIONS = [
  {
    value: "buy_to_rent" as WizardIntent,
    label: "Kapitalanlage",
    description: "Kaufen und vermieten — Rendite und Cashflow im Fokus.",
    icon: <Banknote className="w-5 h-5" />,
  },
  {
    value: "buy_to_live" as WizardIntent,
    label: "Eigennutzung",
    description: "Selbst einziehen — Finanzierungskosten optimieren.",
    icon: <Home className="w-5 h-5" />,
  },
  {
    value: "flip" as WizardIntent,
    label: "Flip",
    description: "Kaufen, sanieren, verkaufen — Spekulationsgewinn.",
    icon: <TrendingUp className="w-5 h-5" />,
  },
];

const EXPERIENCE_OPTIONS = [
  {
    value: "beginner" as ExperienceLevel,
    label: "Einsteiger",
    description: "Erste Immobilie oder wenig Erfahrung — ich erkläre alles.",
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    value: "intermediate" as ExperienceLevel,
    label: "Fortgeschritten",
    description: "1–3 Objekte — ich kenne die Grundbegriffe.",
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    value: "expert" as ExperienceLevel,
    label: "Profi",
    description: "Mehrere Objekte — minimale Erklärungen, maximale Daten.",
    icon: <Briefcase className="w-5 h-5" />,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Step1FormProps {
  analysisId: string;
}

/**
 * Step 1 — "Start" form (intent + experience level).
 *
 * @remarks
 * - Validation is client-side first (disabled submit if incomplete), then
 *   server-side in `saveStepAction` as defence-in-depth.
 * - On success, stores data in Zustand (for offline use) then navigates
 *   to Step 2.
 * - Uses `useTransition` for the pending state so the UI stays interactive.
 *
 * See SPEC-WIZARD-START v1.0.0 §3 (Step 1 form).
 */
export function Step1Form({ analysisId }: Step1FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setStep1 = useAnalysisStore((s) => s.setStep1);
  const setCurrentStep = useAnalysisStore((s) => s.setCurrentStep);
  const savedStep1 = useAnalysisStore((s) => s.step1);

  const [intent, setIntent] = useState<WizardIntent | undefined>(
    savedStep1.intent
  );
  const [experience, setExperience] = useState<ExperienceLevel | undefined>(
    savedStep1.experience_level
  );
  const [error, setError] = useState<string | null>(null);

  const isComplete = intent !== undefined && experience !== undefined;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!intent || !experience) {
      setError("Bitte alle Felder ausfüllen.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await saveStepAction({
        analysisId,
        stepNumber: 1,
        data: { intent, experience_level: experience },
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Persist to Zustand store (survives page refresh via localStorage)
      setStep1({ intent, experience_level: experience });
      setCurrentStep(2);

      // Navigate to step 2
      router.push(`/analysis/${analysisId}/step/2`);
    });
  }

  return (
    <form
      id="step-1-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-10"
    >
      {/* Section: Intent */}
      <section aria-labelledby="intent-heading">
        <h2
          id="intent-heading"
          className="text-base font-semibold text-slate-900 mb-1"
        >
          Was ist Ihr Ziel?
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Wählen Sie die Investitionsart, die am besten zu Ihrem Vorhaben passt.
        </p>
        <RadioCardGroup
          name="intent"
          options={INTENT_OPTIONS}
          value={intent}
          onChange={setIntent}
          label="Investitionsart"
        />
      </section>

      {/* Section: Experience */}
      <section aria-labelledby="experience-heading">
        <h2
          id="experience-heading"
          className="text-base font-semibold text-slate-900 mb-1"
        >
          Wie erfahren sind Sie?
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Bestimmt den Detailgrad der Erläuterungen in den nächsten Schritten.
        </p>
        <RadioCardGroup
          name="experience_level"
          options={EXPERIENCE_OPTIONS}
          value={experience}
          onChange={setExperience}
          label="Erfahrungsniveau"
        />
      </section>

      {/* Inline error */}
      {error && (
        <p
          role="alert"
          className="text-sm text-red-500 -mt-4"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      <StepFooter
        showBack={false}
        isPending={isPending}
        primaryLabel={isComplete ? "Weiter" : "Auswahl treffen"}
      />
    </form>
  );
}
