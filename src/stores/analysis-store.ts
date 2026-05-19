"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Step1Data, Step2Data, Step3Data, Step4Data, Step5Data } from "@/domain/types/wizard";

/**
 * Zustand store for the 16-step analysis wizard.
 *
 * @remarks
 * - **Persistence:** localStorage via `zustand/middleware/persist`.
 *   `skipHydration: true` prevents a hydration mismatch in Next.js SSR —
 *   the client layout calls `useAnalysisStore.persist.rehydrate()` inside
 *   `useEffect` after mount.
 * - **Flat slices:** Each step is a flat `Partial<StepNData>` field. No
 *   nested objects — avoids unnecessary re-renders in selectors.
 * - **Derived KPIs:** Never stored. Computed on demand by domain functions
 *   in `src/domain/calculations/`.
 *
 * See ADR-005 (Zustand), SPEC-WIZARD-START v1.0.0 §4.
 *
 * @see {@link https://github.com/pmndrs/zustand} Zustand v5
 */
export interface AnalysisStore {
  // ── Metadata ──────────────────────────────────────────────────────────────
  /** The ID of the analysis currently being edited, or null if not yet created. */
  analysisId: string | null;
  /** The wizard step the user is currently on (1–16). */
  currentStep: number;

  // ── Step data (one slice per step) ────────────────────────────────────────
  step1: Partial<Step1Data>;
  step2: Partial<Step2Data>;
  step3: Partial<Step3Data>;
  step4: Partial<Step4Data>;
  step5: Partial<Step5Data>;
  // Steps 6–16 will be added in subsequent specs.

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Sets the ID of the persisted analysis after `createAnalysisAction` succeeds. */
  setAnalysisId: (id: string) => void;
  /** Advances or retreats the current step number. */
  setCurrentStep: (step: number) => void;
  /** Merges partial Step 1 data (intent / experience_level) into the slice. */
  setStep1: (data: Partial<Step1Data>) => void;
  /** Merges partial Step 2 data into the slice. */
  setStep2: (data: Partial<Step2Data>) => void;
  /** Merges partial Step 3 data into the slice. */
  setStep3: (data: Partial<Step3Data>) => void;
  /** Merges partial Step 4 data into the slice. */
  setStep4: (data: Partial<Step4Data>) => void;
  /** Merges partial Step 5 data into the slice. */
  setStep5: (data: Partial<Step5Data>) => void;
  /** Resets the entire store to initial state (e.g. after analysis creation). */
  reset: () => void;
}

const initialState: Omit<
  AnalysisStore,
  | "setAnalysisId"
  | "setCurrentStep"
  | "setStep1"
  | "setStep2"
  | "setStep3"
  | "setStep4"
  | "setStep5"
  | "reset"
> = {
  analysisId: null,
  currentStep: 1,
  step1: {},
  step2: {},
  step3: {},
  step4: {},
  step5: {},
};

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set) => ({
      ...initialState,

      setAnalysisId: (id) => set({ analysisId: id }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setStep1: (data) =>
        set((state) => ({ step1: { ...state.step1, ...data } })),
      setStep2: (data) =>
        set((state) => ({ step2: { ...state.step2, ...data } })),
      setStep3: (data) =>
        set((state) => ({ step3: { ...state.step3, ...data } })),
      setStep4: (data) =>
        set((state) => ({ step4: { ...state.step4, ...data } })),
      setStep5: (data) =>
        set((state) => ({ step5: { ...state.step5, ...data } })),
      reset: () => set({ ...initialState }),
    }),
    {
      name: "propscape-analysis",
      storage: createJSONStorage(() => localStorage),
      /**
       * `skipHydration: true` is required for Next.js SSR.
       *
       * Without it, the server renders with `initialState` (analysisId: null)
       * but the client immediately hydrates from localStorage — causing a
       * React hydration mismatch error.
       *
       * The wizard layout (`WizardLayout`) calls
       * `useAnalysisStore.persist.rehydrate()` in a `useEffect` to trigger
       * hydration after mount.
       *
       * @see https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md#skiphydration
       */
      skipHydration: true,
    }
  )
);
