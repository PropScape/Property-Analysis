import { describe, it, expect } from "vitest";
import { step2Schema } from "@/domain/schemas/step2";

const VALID = {
  property_type: "wohnung",
  location: "10115 Berlin",
  living_area_sqm: 75,
  year_built: 1998,
  purchase_date: "2026-09-01",
  occupancy_type: "vermietet",
  condition: "gepflegt",
};

describe("step2Schema", () => {
  it("accepts a fully valid payload", () => {
    expect(() => step2Schema.parse(VALID)).not.toThrow();
  });

  it("accepts all three property_type values", () => {
    for (const t of ["wohnung", "haus", "mfh"] as const) {
      expect(() => step2Schema.parse({ ...VALID, property_type: t })).not.toThrow();
    }
  });

  it("rejects an unknown property_type", () => {
    const result = step2Schema.safeParse({ ...VALID, property_type: "gewerbe" });
    expect(result.success).toBe(false);
  });

  it("rejects a location that is too short", () => {
    const result = step2Schema.safeParse({ ...VALID, location: "X" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("2 Zeichen");
    }
  });

  it("rejects living_area_sqm ≤ 0", () => {
    const result = step2Schema.safeParse({ ...VALID, living_area_sqm: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects living_area_sqm > 10 000", () => {
    const result = step2Schema.safeParse({ ...VALID, living_area_sqm: 10_001 });
    expect(result.success).toBe(false);
  });

  it("rejects year_built < 1800", () => {
    const result = step2Schema.safeParse({ ...VALID, year_built: 1799 });
    expect(result.success).toBe(false);
  });

  it("rejects year_built too far in the future", () => {
    const result = step2Schema.safeParse({
      ...VALID,
      year_built: new Date().getFullYear() + 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid purchase_date format", () => {
    const result = step2Schema.safeParse({ ...VALID, purchase_date: "01.09.2026" });
    expect(result.success).toBe(false);
  });

  it("accepts all occupancy_type values", () => {
    for (const t of ["vermietet", "leerstehend", "eigennutzung"] as const) {
      expect(() =>
        step2Schema.parse({ ...VALID, occupancy_type: t })
      ).not.toThrow();
    }
  });

  it("accepts all condition values", () => {
    for (const c of [
      "neubau",
      "saniert",
      "gepflegt",
      "renovierungsbeduerftig",
      "sanierungsbeduerftig",
    ] as const) {
      expect(() => step2Schema.parse({ ...VALID, condition: c })).not.toThrow();
    }
  });

  it("rejects an unknown condition", () => {
    const result = step2Schema.safeParse({ ...VALID, condition: "abrissreif" });
    expect(result.success).toBe(false);
  });
});
