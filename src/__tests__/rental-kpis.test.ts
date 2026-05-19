import { describe, it, expect } from "vitest";
import { computeRentalKpis } from "@/domain/calculations/rental-kpis";

describe("computeRentalKpis", () => {
  // ── Null guard ────────────────────────────────────────────────────────────

  it("returns all nulls when purchase price is null", () => {
    const result = computeRentalKpis(null, 125_000, 2);
    expect(result.grossYieldPercent).toBeNull();
    expect(result.netAnnualRentEur).toBeNull();
    expect(result.purchasePriceFactor).toBeNull();
  });

  it("returns all nulls when cold rent is null", () => {
    const result = computeRentalKpis(35_000_000, null, 2);
    expect(result.grossYieldPercent).toBeNull();
  });

  it("returns all nulls when purchase price is 0", () => {
    const result = computeRentalKpis(0, 125_000, 2);
    expect(result.grossYieldPercent).toBeNull();
  });

  // ── Correct calculation ───────────────────────────────────────────────────

  it("computes gross yield correctly with zero vacancy", () => {
    // 350 000 € purchase, 1 250 €/month rent, 0% vacancy
    // Annual rent = 1 250 × 12 = 15 000 €
    // Gross yield = 15 000 / 350 000 × 100 = 4.285...%
    const result = computeRentalKpis(35_000_000, 125_000, 0);
    expect(result.grossYieldPercent).toBeCloseTo(4.2857, 3);
  });

  it("applies vacancy deduction to annual rent", () => {
    // 1 250 €/month, 2% vacancy → 1 250 × 12 × 0.98 = 14 700 €
    const result = computeRentalKpis(35_000_000, 125_000, 2);
    expect(result.netAnnualRentEur).toBeCloseTo(14700, 0);
  });

  it("computes purchase price factor correctly", () => {
    // 350 000 / 14 700 ≈ 23.81 years
    const result = computeRentalKpis(35_000_000, 125_000, 2);
    expect(result.purchasePriceFactor).toBeCloseTo(23.81, 1);
  });

  it("returns null factor when net rent is zero (100% vacancy)", () => {
    const result = computeRentalKpis(35_000_000, 125_000, 100);
    expect(result.purchasePriceFactor).toBeNull();
  });

  it("uses 0% vacancy as default", () => {
    const withDefault = computeRentalKpis(35_000_000, 125_000);
    const withZero = computeRentalKpis(35_000_000, 125_000, 0);
    expect(withDefault.grossYieldPercent).toBe(withZero.grossYieldPercent);
  });
});
