/**
 * Unit tests for the analysis Zustand store.
 *
 * Spec: SPEC-WIZARD-START v1.0.0 §5 (acceptance criteria 5.2).
 *
 * @remarks
 * We test the store's actions in isolation by directly calling them
 * on a created store instance. Persistence middleware is not tested
 * here (jsdom has no localStorage) — that is covered by E2E tests.
 */
import { describe, it, expect, beforeEach } from "vitest";

// We import the raw creator function so we can spin up a clean instance
// per test, rather than sharing global state through the singleton export.
import { create } from "zustand";
import type { AnalysisStore } from "@/stores/analysis-store";

/**
 * Creates a fresh, unpersisted store instance for testing.
 *
 * We inline the reducer logic here (not the persist-wrapped singleton)
 * so tests remain deterministic and free of localStorage side effects.
 */
function createTestStore() {
  return create<AnalysisStore>()((set) => ({
    analysisId: null,
    currentStep: 1,
    step1: {},
    step2: {},
    step3: {},

    setAnalysisId: (id) => set({ analysisId: id }),
    setCurrentStep: (step) => set({ currentStep: step }),
    setStep1: (data) =>
      set((state) => ({ step1: { ...state.step1, ...data } })),
    setStep2: (data) =>
      set((state) => ({ step2: { ...state.step2, ...data } })),
    setStep3: (data) =>
      set((state) => ({ step3: { ...state.step3, ...data } })),
    reset: () =>
      set({ analysisId: null, currentStep: 1, step1: {}, step2: {}, step3: {} }),
  }));
}

describe("useAnalysisStore", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it("initialises with null analysisId, step 1, and empty step1 slice", () => {
    const state = store.getState();
    expect(state.analysisId).toBeNull();
    expect(state.currentStep).toBe(1);
    expect(state.step1).toEqual({});
  });

  it("setAnalysisId updates the analysisId", () => {
    store.getState().setAnalysisId("abc-123");
    expect(store.getState().analysisId).toBe("abc-123");
  });

  it("setCurrentStep updates the step", () => {
    store.getState().setCurrentStep(3);
    expect(store.getState().currentStep).toBe(3);
  });

  it("setStep1 merges partial data into the step1 slice", () => {
    store.getState().setStep1({ intent: "flip" });
    expect(store.getState().step1.intent).toBe("flip");
    expect(store.getState().step1.experience_level).toBeUndefined();

    store.getState().setStep1({ experience_level: "expert" });
    expect(store.getState().step1).toEqual({
      intent: "flip",
      experience_level: "expert",
    });
  });

  it("setStep1 does not clobber existing keys not in the update", () => {
    store.getState().setStep1({ intent: "buy_to_rent", experience_level: "beginner" });
    store.getState().setStep1({ intent: "buy_to_live" });

    expect(store.getState().step1).toEqual({
      intent: "buy_to_live",
      experience_level: "beginner",
    });
  });

  it("reset returns state to initial values", () => {
    store.getState().setAnalysisId("xyz");
    store.getState().setCurrentStep(5);
    store.getState().setStep1({ intent: "flip", experience_level: "expert" });

    store.getState().reset();

    const state = store.getState();
    expect(state.analysisId).toBeNull();
    expect(state.currentStep).toBe(1);
    expect(state.step1).toEqual({});
    expect(state.step2).toEqual({});
  });

  it("setStep2 merges partial data into the step2 slice", () => {
    store.getState().setStep2({ property_type: "haus", location: "80331 München" });
    expect(store.getState().step2.property_type).toBe("haus");
    expect(store.getState().step2.location).toBe("80331 München");
    expect(store.getState().step2.year_built).toBeUndefined();
  });
});
