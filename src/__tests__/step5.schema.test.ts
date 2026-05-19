import { describe, it, expect } from "vitest";
import { step5Schema } from "@/domain/schemas/step5";

const validMeasure = {
  id: "abc-123",
  label: "Neues Dach",
  cost_cents: 2_500_000,
  is_immediate: true,
  is_financed: false,
};

const validPayload = {
  measures: [validMeasure],
  financing_interest_rate_percent: 3.5,
  financing_repayment_rate_percent: 2.0,
};

describe("step5Schema", () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  it("accepts a valid single measure", () => {
    expect(step5Schema.safeParse(validPayload).success).toBe(true);
  });

  it("accepts an empty measures array", () => {
    const result = step5Schema.safeParse({ ...validPayload, measures: [] });
    expect(result.success).toBe(true);
  });

  it("accepts a measure with cost_cents = 0", () => {
    const result = step5Schema.safeParse({
      ...validPayload,
      measures: [{ ...validMeasure, cost_cents: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts financing rates of 0", () => {
    const result = step5Schema.safeParse({
      ...validPayload,
      financing_interest_rate_percent: 0,
      financing_repayment_rate_percent: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts 20 measures (at the limit)", () => {
    const measures = Array.from({ length: 20 }, (_, i) => ({
      ...validMeasure,
      id: `id-${i}`,
      label: `Maßnahme ${i + 1}`,
    }));
    const result = step5Schema.safeParse({ ...validPayload, measures });
    expect(result.success).toBe(true);
  });

  // ── Measures array limits ─────────────────────────────────────────────────

  it("rejects more than 20 measures", () => {
    const measures = Array.from({ length: 21 }, (_, i) => ({
      ...validMeasure,
      id: `id-${i}`,
      label: `Maßnahme ${i + 1}`,
    }));
    const result = step5Schema.safeParse({ ...validPayload, measures });
    expect(result.success).toBe(false);
  });

  // ── Label validation ──────────────────────────────────────────────────────

  it("rejects a measure with an empty label", () => {
    const result = step5Schema.safeParse({
      ...validPayload,
      measures: [{ ...validMeasure, label: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a label exceeding 100 characters", () => {
    const result = step5Schema.safeParse({
      ...validPayload,
      measures: [{ ...validMeasure, label: "x".repeat(101) }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a label of exactly 100 characters", () => {
    const result = step5Schema.safeParse({
      ...validPayload,
      measures: [{ ...validMeasure, label: "x".repeat(100) }],
    });
    expect(result.success).toBe(true);
  });

  // ── cost_cents validation ─────────────────────────────────────────────────

  it("rejects a negative cost_cents", () => {
    const result = step5Schema.safeParse({
      ...validPayload,
      measures: [{ ...validMeasure, cost_cents: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer cost_cents", () => {
    const result = step5Schema.safeParse({
      ...validPayload,
      measures: [{ ...validMeasure, cost_cents: 100.5 }],
    });
    expect(result.success).toBe(false);
  });

  // ── Financing rate validation ─────────────────────────────────────────────

  it("rejects interest rate above 20", () => {
    const result = step5Schema.safeParse({
      ...validPayload,
      financing_interest_rate_percent: 20.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects repayment rate below 0", () => {
    const result = step5Schema.safeParse({
      ...validPayload,
      financing_repayment_rate_percent: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing financing fields", () => {
    const { financing_interest_rate_percent: _, ...withoutInterest } = validPayload;
    const result = step5Schema.safeParse(withoutInterest);
    expect(result.success).toBe(false);
  });
});
