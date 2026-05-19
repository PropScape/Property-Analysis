import { describe, it, expect } from "vitest";
import { computeRenovationBreakdown } from "@/domain/calculations/renovation";
import type { RenovationMeasure } from "@/domain/types/wizard";

function measure(
  overrides: Partial<RenovationMeasure> = {}
): RenovationMeasure {
  return {
    id: "test-id",
    label: "Test",
    cost_cents: 0,
    is_immediate: true,
    is_financed: false,
    ...overrides,
  };
}

const PREV = 39_309_500; // 393.095 €

describe("computeRenovationBreakdown", () => {
  // ── Empty measures ────────────────────────────────────────────────────────

  it("returns all zeros when measures is empty", () => {
    const result = computeRenovationBreakdown([], PREV);
    expect(result.immediateCents).toBe(0);
    expect(result.deferredCents).toBe(0);
    expect(result.totalMeasuresCents).toBe(0);
    expect(result.hasFinancedMeasures).toBe(false);
  });

  it("passes through previousInvestmentCents unchanged when no measures", () => {
    const result = computeRenovationBreakdown([], PREV);
    expect(result.newTotalInvestmentCents).toBe(PREV);
  });

  // ── Immediate vs deferred ────────────────────────────────────────────────

  it("sums immediate measures into immediateCents", () => {
    const measures = [
      measure({ cost_cents: 2_500_000, is_immediate: true }),
      measure({ cost_cents: 1_000_000, is_immediate: true }),
    ];
    const result = computeRenovationBreakdown(measures, PREV);
    expect(result.immediateCents).toBe(3_500_000);
    expect(result.deferredCents).toBe(0);
  });

  it("sums deferred measures into deferredCents", () => {
    const measures = [
      measure({ cost_cents: 1_500_000, is_immediate: false }),
    ];
    const result = computeRenovationBreakdown(measures, PREV);
    expect(result.immediateCents).toBe(0);
    expect(result.deferredCents).toBe(1_500_000);
  });

  it("splits mixed immediate and deferred measures correctly", () => {
    const measures = [
      measure({ cost_cents: 2_500_000, is_immediate: true }),
      measure({ cost_cents: 1_500_000, is_immediate: false }),
    ];
    const result = computeRenovationBreakdown(measures, PREV);
    expect(result.immediateCents).toBe(2_500_000);
    expect(result.deferredCents).toBe(1_500_000);
    expect(result.totalMeasuresCents).toBe(4_000_000);
  });

  // ── New total ─────────────────────────────────────────────────────────────

  it("computes newTotalInvestmentCents as prev + all measures", () => {
    const measures = [
      measure({ cost_cents: 2_500_000, is_immediate: true }),
      measure({ cost_cents: 1_500_000, is_immediate: false }),
    ];
    const result = computeRenovationBreakdown(measures, PREV);
    expect(result.newTotalInvestmentCents).toBe(PREV + 4_000_000);
  });

  it("works correctly with previousInvestmentCents = 0", () => {
    const measures = [measure({ cost_cents: 1_000_000 })];
    const result = computeRenovationBreakdown(measures, 0);
    expect(result.newTotalInvestmentCents).toBe(1_000_000);
  });

  // ── Financed flag ─────────────────────────────────────────────────────────

  it("returns hasFinancedMeasures = false when none is financed", () => {
    const measures = [measure({ is_financed: false })];
    const result = computeRenovationBreakdown(measures, PREV);
    expect(result.hasFinancedMeasures).toBe(false);
  });

  it("returns hasFinancedMeasures = true when at least one is financed", () => {
    const measures = [
      measure({ is_financed: false }),
      measure({ is_financed: true }),
    ];
    const result = computeRenovationBreakdown(measures, PREV);
    expect(result.hasFinancedMeasures).toBe(true);
  });

  // ── Zero-cost measures ────────────────────────────────────────────────────

  it("handles measures with cost_cents = 0 without error", () => {
    const measures = [measure({ cost_cents: 0 })];
    const result = computeRenovationBreakdown(measures, PREV);
    expect(result.totalMeasuresCents).toBe(0);
    expect(result.newTotalInvestmentCents).toBe(PREV);
  });
});
