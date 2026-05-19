import { describe, it, expect } from "vitest";
import { step4Schema } from "@/domain/schemas/step4";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Minimal valid payload. */
const VALID = {
  broker_fee_percent: 3.57,
  notary_fee_percent: 1.5,
  land_registry_fee_percent: 0.5,
  bundesland: "NW",
  custom_items: [],
};

/** A valid custom item. */
const VALID_ITEM = { label: "Wertgutachten", amount_cents: 85_000 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("step4Schema", () => {
  // ── Happy path ─────────────────────────────────────────────────────────────

  it("accepts a fully valid payload with no custom items", () => {
    expect(() => step4Schema.parse(VALID)).not.toThrow();
  });

  it("accepts a payload with custom items", () => {
    expect(() =>
      step4Schema.parse({ ...VALID, custom_items: [VALID_ITEM] })
    ).not.toThrow();
  });

  it("accepts all 16 Bundesland keys", () => {
    const keys = [
      "BB", "BE", "BW", "BY", "HB", "HE", "HH", "MV",
      "NI", "NW", "RP", "SH", "SL", "SN", "ST", "TH",
    ];
    for (const bl of keys) {
      expect(() =>
        step4Schema.parse({ ...VALID, bundesland: bl })
      ).not.toThrow();
    }
  });

  // ── broker_fee_percent ─────────────────────────────────────────────────────

  it("accepts broker_fee_percent = 0 (no broker)", () => {
    expect(() =>
      step4Schema.parse({ ...VALID, broker_fee_percent: 0 })
    ).not.toThrow();
  });

  it("rejects broker_fee_percent < 0", () => {
    const result = step4Schema.safeParse({ ...VALID, broker_fee_percent: -0.1 });
    expect(result.success).toBe(false);
  });

  it("rejects broker_fee_percent > 10", () => {
    const result = step4Schema.safeParse({ ...VALID, broker_fee_percent: 10.01 });
    expect(result.success).toBe(false);
  });

  // ── notary_fee_percent ─────────────────────────────────────────────────────

  it("accepts notary_fee_percent = 0", () => {
    expect(() =>
      step4Schema.parse({ ...VALID, notary_fee_percent: 0 })
    ).not.toThrow();
  });

  it("rejects notary_fee_percent > 5", () => {
    const result = step4Schema.safeParse({ ...VALID, notary_fee_percent: 5.01 });
    expect(result.success).toBe(false);
  });

  // ── land_registry_fee_percent ──────────────────────────────────────────────

  it("rejects land_registry_fee_percent > 5", () => {
    const result = step4Schema.safeParse({
      ...VALID,
      land_registry_fee_percent: 5.01,
    });
    expect(result.success).toBe(false);
  });

  // ── bundesland ─────────────────────────────────────────────────────────────

  it("rejects an unknown Bundesland key", () => {
    const result = step4Schema.safeParse({ ...VALID, bundesland: "XX" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBeTruthy();
    }
  });

  it("rejects a full state name instead of abbreviation", () => {
    const result = step4Schema.safeParse({
      ...VALID,
      bundesland: "Nordrhein-Westfalen",
    });
    expect(result.success).toBe(false);
  });

  // ── custom_items ───────────────────────────────────────────────────────────

  it("accepts custom_items with a valid single item", () => {
    expect(() =>
      step4Schema.parse({ ...VALID, custom_items: [VALID_ITEM] })
    ).not.toThrow();
  });

  it("rejects a custom item with an empty label", () => {
    const result = step4Schema.safeParse({
      ...VALID,
      custom_items: [{ label: "", amount_cents: 100 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("leer");
    }
  });

  it("rejects a custom item with a label exceeding 100 chars", () => {
    const result = step4Schema.safeParse({
      ...VALID,
      custom_items: [{ label: "x".repeat(101), amount_cents: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a custom item with negative amount_cents", () => {
    const result = step4Schema.safeParse({
      ...VALID,
      custom_items: [{ label: "Test", amount_cents: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a custom item with a non-integer amount_cents", () => {
    const result = step4Schema.safeParse({
      ...VALID,
      custom_items: [{ label: "Test", amount_cents: 100.5 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 20 custom items", () => {
    const items = Array.from({ length: 21 }, (_, i) => ({
      label: `Item ${i + 1}`,
      amount_cents: 100,
    }));
    const result = step4Schema.safeParse({ ...VALID, custom_items: items });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("20");
    }
  });

  it("accepts exactly 20 custom items", () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      label: `Item ${i + 1}`,
      amount_cents: 100,
    }));
    expect(() =>
      step4Schema.parse({ ...VALID, custom_items: items })
    ).not.toThrow();
  });
});
