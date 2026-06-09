/**
 * Unit tests for computePropertyNuancesBreakdown — Step 12 domain calculations.
 *
 * See SPEC-WIZARD-STEP12 v1.0.0 §3 (Business Logic).
 */
import { describe, it, expect } from "vitest";
import { computePropertyNuancesBreakdown } from "@/domain/calculations/property-nuances";
import type { SpecialDeductionItem } from "@/domain/types/wizard";

const NO_DEDUCTIONS: SpecialDeductionItem[] = [];

describe("computePropertyNuancesBreakdown", () => {
  // ── Canonical example from SPEC-WIZARD-STEP12 v1.0.0 §4 AC-2 ──────────────
  it("computes annual operating costs from the spec AC-2 example", () => {
    // non_recoverable = 35 €/month = 3500 cents
    // maintenance = 1.5 €/m², area = 80 m²
    // annualNonRecoverable = 3500 × 12 = 42000
    // annualMaintenance = 1.5 × 80 × 12 × 100 = 144000
    // totalOperating = 42000 + 144000 = 186000
    const result = computePropertyNuancesBreakdown(3500, 1.5, 80, NO_DEDUCTIONS);

    expect(result.annualNonRecoverableCents).toBe(42000);
    expect(result.annualMaintenanceCents).toBe(144000);
    expect(result.annualOperatingCostsCents).toBe(186000);
    expect(result.totalSpecialDeductionsCents).toBe(0);
  });

  // ── Spec AC-3: special deduction total ────────────────────────────────────
  it("sums special deductions correctly (AC-3)", () => {
    const deductions: SpecialDeductionItem[] = [
      { id: "a", label: "Fahrtkosten", amount_per_year_cents: 120000 },
      { id: "b", label: "Bürobedarf", amount_per_year_cents: 48000 },
    ];
    const result = computePropertyNuancesBreakdown(0, 0, 0, deductions);

    expect(result.totalSpecialDeductionsCents).toBe(168000);
  });

  // ── Zero inputs ───────────────────────────────────────────────────────────
  it("returns all zeros when all inputs are zero", () => {
    const result = computePropertyNuancesBreakdown(0, 0, 0, NO_DEDUCTIONS);

    expect(result.annualNonRecoverableCents).toBe(0);
    expect(result.annualMaintenanceCents).toBe(0);
    expect(result.annualOperatingCostsCents).toBe(0);
    expect(result.totalSpecialDeductionsCents).toBe(0);
  });

  // ── Non-recoverable component in isolation ────────────────────────────────
  it("computes only non-recoverable when maintenance is zero", () => {
    const result = computePropertyNuancesBreakdown(5000, 0, 100, NO_DEDUCTIONS);

    expect(result.annualNonRecoverableCents).toBe(60000); // 5000 × 12
    expect(result.annualMaintenanceCents).toBe(0);
    expect(result.annualOperatingCostsCents).toBe(60000);
  });

  // ── Maintenance component in isolation ────────────────────────────────────
  it("computes only maintenance when non-recoverable is zero", () => {
    // 2.0 €/m² × 100 m² × 12 months × 100 (€→cents) = 240000
    const result = computePropertyNuancesBreakdown(0, 2.0, 100, NO_DEDUCTIONS);

    expect(result.annualMaintenanceCents).toBe(240000);
    expect(result.annualNonRecoverableCents).toBe(0);
    expect(result.annualOperatingCostsCents).toBe(240000);
  });

  // ── Rounding ──────────────────────────────────────────────────────────────
  it("rounds annual maintenance to nearest integer cent", () => {
    // 1.3 €/m² × 75 m² × 12 months × 100 = 117000 exactly
    const result = computePropertyNuancesBreakdown(0, 1.3, 75, NO_DEDUCTIONS);
    expect(Number.isInteger(result.annualMaintenanceCents)).toBe(true);
  });

  it("rounds fractional maintenance correctly (no float drift)", () => {
    // 1.1 €/m² × 30 m² × 12 months × 100 = 39600 exactly
    const result = computePropertyNuancesBreakdown(0, 1.1, 30, NO_DEDUCTIONS);
    expect(result.annualMaintenanceCents).toBe(39600);
    expect(Number.isInteger(result.annualMaintenanceCents)).toBe(true);
  });

  // ── Single deduction ──────────────────────────────────────────────────────
  it("correctly aggregates a single deduction item", () => {
    const deductions: SpecialDeductionItem[] = [
      { id: "x", label: "Software", amount_per_year_cents: 50000 },
    ];
    const result = computePropertyNuancesBreakdown(1000, 0.5, 60, deductions);

    expect(result.totalSpecialDeductionsCents).toBe(50000);
  });

  // ── Multiple deductions — summation invariant ─────────────────────────────
  it("sums all deduction items correctly (multiple)", () => {
    const deductions: SpecialDeductionItem[] = [
      { id: "a", label: "Fahrtkosten", amount_per_year_cents: 120000 },
      { id: "b", label: "Bürobedarf", amount_per_year_cents: 48000 },
      { id: "c", label: "Software", amount_per_year_cents: 30000 },
    ];
    const result = computePropertyNuancesBreakdown(0, 0, 0, deductions);

    const expectedTotal = 120000 + 48000 + 30000;
    expect(result.totalSpecialDeductionsCents).toBe(expectedTotal);
  });

  // ── Operating cost is always non-recoverable + maintenance ────────────────
  it("annualOperatingCostsCents always equals sum of components", () => {
    const result = computePropertyNuancesBreakdown(2500, 1.2, 65, NO_DEDUCTIONS);

    expect(result.annualOperatingCostsCents).toBe(
      result.annualNonRecoverableCents + result.annualMaintenanceCents
    );
  });
});
