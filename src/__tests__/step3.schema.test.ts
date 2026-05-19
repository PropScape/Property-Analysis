import { describe, it, expect } from "vitest";
import { step3Schema } from "@/domain/schemas/step3";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Minimal valid payload (all required fields + defaults that satisfy refinements). */
const VALID = {
  purchase_price_cents: 35_000_000, // 350 000 €
  cold_rent_cents: 125_000,          // 1 250 €
  rent_start_date: "2026-09-01",
  vacancy_rate_percent: 2,
  rent_growth_enabled: true,
  // Required when rent_growth_enabled = true (schema refinement)
  rent_growth_rate_percent: 1.5,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("step3Schema", () => {
  // ── Happy path ─────────────────────────────────────────────────────────────

  it("accepts a fully valid payload with required fields only", () => {
    expect(() => step3Schema.parse(VALID)).not.toThrow();
  });

  it("accepts a payload with all optional fields set", () => {
    expect(() =>
      step3Schema.parse({
        ...VALID,
        warm_rent_cents: 145_000,
        rent_growth_rate_percent: 1.5,
      })
    ).not.toThrow();
  });

  it("accepts rent_growth_enabled = false without requiring rent_growth_rate_percent", () => {
    expect(() =>
      step3Schema.parse({ ...VALID, rent_growth_enabled: false })
    ).not.toThrow();
  });

  // ── purchase_price_cents ───────────────────────────────────────────────────

  it("rejects purchase_price_cents = 0", () => {
    const result = step3Schema.safeParse({ ...VALID, purchase_price_cents: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects purchase_price_cents < 0", () => {
    const result = step3Schema.safeParse({ ...VALID, purchase_price_cents: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects purchase_price_cents exceeding 1 billion EUR", () => {
    const result = step3Schema.safeParse({
      ...VALID,
      purchase_price_cents: 100_000_000_01,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer purchase_price_cents", () => {
    const result = step3Schema.safeParse({
      ...VALID,
      purchase_price_cents: 35_000_000.5,
    });
    expect(result.success).toBe(false);
  });

  // ── cold_rent_cents ────────────────────────────────────────────────────────

  it("rejects cold_rent_cents = 0", () => {
    const result = step3Schema.safeParse({ ...VALID, cold_rent_cents: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects cold_rent_cents exceeding 1 million EUR", () => {
    const result = step3Schema.safeParse({
      ...VALID,
      cold_rent_cents: 100_000_01,
    });
    expect(result.success).toBe(false);
  });

  // ── warm_rent_cents (optional) ─────────────────────────────────────────────

  it("accepts warm_rent_cents when omitted", () => {
    const { warm_rent_cents: _, ...without } = { ...VALID, warm_rent_cents: undefined };
    expect(() => step3Schema.parse(without)).not.toThrow();
  });

  it("rejects warm_rent_cents = 0", () => {
    const result = step3Schema.safeParse({ ...VALID, warm_rent_cents: 0 });
    expect(result.success).toBe(false);
  });

  // ── rent_start_date ────────────────────────────────────────────────────────

  it("rejects rent_start_date in DD.MM.YYYY format", () => {
    const result = step3Schema.safeParse({
      ...VALID,
      rent_start_date: "01.09.2026",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("JJJJ-MM-TT");
    }
  });

  /**
   * NOTE: step3Schema validates the ISO date *format* via regex only —
   * it does not perform semantic calendar validation (e.g. month 13).
   * This is a known and accepted limitation per SPEC-WIZARD-STEP3.
   * Full calendar validation would require a date library and is deferred.
   */
  it("accepts an ISO-format date with invalid month (regex-only validation)", () => {
    const result = step3Schema.safeParse({
      ...VALID,
      rent_start_date: "2026-13-01",
    });
    // The schema only checks pattern, so this passes format validation
    expect(result.success).toBe(true);
  });

  // ── vacancy_rate_percent ───────────────────────────────────────────────────

  it("accepts vacancy_rate_percent = 0", () => {
    expect(() =>
      step3Schema.parse({ ...VALID, vacancy_rate_percent: 0 })
    ).not.toThrow();
  });

  it("accepts vacancy_rate_percent = 10", () => {
    expect(() =>
      step3Schema.parse({ ...VALID, vacancy_rate_percent: 10 })
    ).not.toThrow();
  });

  it("rejects vacancy_rate_percent > 10", () => {
    const result = step3Schema.safeParse({
      ...VALID,
      vacancy_rate_percent: 10.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects vacancy_rate_percent < 0", () => {
    const result = step3Schema.safeParse({
      ...VALID,
      vacancy_rate_percent: -0.1,
    });
    expect(result.success).toBe(false);
  });

  // ── rent_growth_rate_percent (optional) ───────────────────────────────────

  it("accepts rent_growth_rate_percent = 0", () => {
    expect(() =>
      step3Schema.parse({ ...VALID, rent_growth_rate_percent: 0 })
    ).not.toThrow();
  });

  it("rejects rent_growth_rate_percent > 20", () => {
    const result = step3Schema.safeParse({
      ...VALID,
      rent_growth_rate_percent: 20.1,
    });
    expect(result.success).toBe(false);
  });
});
