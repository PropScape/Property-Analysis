/**
 * Unit tests for Step 12 Zod schema — Objektspezifische Nuancen.
 *
 * See SPEC-WIZARD-STEP12 v1.0.0.
 */
import { describe, it, expect } from "vitest";
import { step12Schema } from "@/domain/schemas/step12";

const validBase = {
  is_furnished: false,
  is_short_term_rental: false,
  cost_allocation_type: "nicht_umlegbar" as const,
  non_recoverable_costs_per_month_cents: 3500,
  maintenance_per_sqm_euro: 1.5,
  special_deductions: [],
};

describe("step12Schema", () => {
  // ── Happy path ─────────────────────────────────────────────────────────────
  it("accepts a minimal valid payload with empty deductions", () => {
    const result = step12Schema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts all cost_allocation_type values", () => {
    for (const type of [
      "voll_umlegbar",
      "teilweise_umlegbar",
      "nicht_umlegbar",
    ] as const) {
      const result = step12Schema.safeParse({
        ...validBase,
        cost_allocation_type: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts boolean flags in any combination", () => {
    const combos = [
      { is_furnished: true, is_short_term_rental: false },
      { is_furnished: false, is_short_term_rental: true },
      { is_furnished: true, is_short_term_rental: true },
    ];
    for (const combo of combos) {
      const result = step12Schema.safeParse({ ...validBase, ...combo });
      expect(result.success).toBe(true);
    }
  });

  it("accepts valid special deductions with cent amounts", () => {
    const result = step12Schema.safeParse({
      ...validBase,
      special_deductions: [
        { id: "abc-123", label: "Fahrtkosten", amount_per_year_cents: 120000 },
        { id: "def-456", label: "Bürobedarf", amount_per_year_cents: 48000 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts zero amounts for non-recoverable costs and maintenance", () => {
    const result = step12Schema.safeParse({
      ...validBase,
      non_recoverable_costs_per_month_cents: 0,
      maintenance_per_sqm_euro: 0,
    });
    expect(result.success).toBe(true);
  });

  // ── Cost allocation type ───────────────────────────────────────────────────
  it("rejects an unknown cost_allocation_type", () => {
    const result = step12Schema.safeParse({
      ...validBase,
      cost_allocation_type: "unknown_type",
    });
    expect(result.success).toBe(false);
  });

  // ── Numeric constraints ────────────────────────────────────────────────────
  it("rejects negative non_recoverable_costs_per_month_cents", () => {
    const result = step12Schema.safeParse({
      ...validBase,
      non_recoverable_costs_per_month_cents: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative maintenance_per_sqm_euro", () => {
    const result = step12Schema.safeParse({
      ...validBase,
      maintenance_per_sqm_euro: -0.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maintenance_per_sqm_euro above 20", () => {
    const result = step12Schema.safeParse({
      ...validBase,
      maintenance_per_sqm_euro: 20.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer non_recoverable_costs_per_month_cents", () => {
    const result = step12Schema.safeParse({
      ...validBase,
      non_recoverable_costs_per_month_cents: 35.5,
    });
    expect(result.success).toBe(false);
  });

  // ── Special deductions ─────────────────────────────────────────────────────
  it("rejects an empty label in a deduction item", () => {
    const result = step12Schema.safeParse({
      ...validBase,
      special_deductions: [
        { id: "abc", label: "", amount_per_year_cents: 10000 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a label exceeding 100 characters", () => {
    const result = step12Schema.safeParse({
      ...validBase,
      special_deductions: [
        { id: "abc", label: "A".repeat(101), amount_per_year_cents: 10000 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount_per_year_cents", () => {
    const result = step12Schema.safeParse({
      ...validBase,
      special_deductions: [
        { id: "abc", label: "Test", amount_per_year_cents: -500 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 20 deduction items", () => {
    const items = Array.from({ length: 21 }, (_, i) => ({
      id: `item-${i}`,
      label: `Abzug ${i}`,
      amount_per_year_cents: 10000,
    }));
    const result = step12Schema.safeParse({
      ...validBase,
      special_deductions: items,
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 20 deduction items (boundary)", () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      label: `Abzug ${i}`,
      amount_per_year_cents: 10000,
    }));
    const result = step12Schema.safeParse({
      ...validBase,
      special_deductions: items,
    });
    expect(result.success).toBe(true);
  });
});
