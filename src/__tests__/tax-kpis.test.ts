import { describe, it, expect } from "vitest";
import {
  computeReturnOnEquity,
  getChurchTaxRateForState,
  computeEffectiveTaxRate,
  computeAfaBasis,
  computeAnnualDepreciation,
  computeTaxShield,
} from "@/domain/calculations/tax-kpis";

describe("Tax KPIs Calculations", () => {
  describe("computeReturnOnEquity", () => {
    it("calculates return on equity correctly based on AC", () => {
      // GIVEN monthly cold rent of 1,000 € (12,000 € p.a.) -> 100_000 cents
      // AND annual interest payment of 3,800 € (which means e.g. 100,000 € loan at 3.8%)
      // AND equity investment of 20,000 € -> 20_000_00 cents
      
      const roe = computeReturnOnEquity(
        1_000_00,       // 1,000 € monthly rent
        100_000_00,     // 100,000 € loan amount
        3.8,            // 3.8% interest -> 3,800 € annual interest
        20_000_00       // 20,000 € equity
      );

      // Mietertrag = 12,000
      // Zinszahlungen = 3,800
      // Jahresreinertrag = 8,200
      // ROE = (8,200 / 20,000) * 100 = 41.0 %
      
      expect(roe).toBe(41.0);
    });

    it("returns null if equity is 0 or negative", () => {
      const roeZero = computeReturnOnEquity(1000_00, 100_000_00, 3.8, 0);
      expect(roeZero).toBeNull();

      const roeNegative = computeReturnOnEquity(1000_00, 100_000_00, 3.8, -5000_00);
      expect(roeNegative).toBeNull();
    });

    it("handles negative return on equity", () => {
      // 1,000 € rent (12,000/yr), 500,000 € loan at 4% (20,000/yr interest)
      // Net income = -8,000/yr
      // Equity = 50,000 €
      // ROE = (-8,000 / 50,000) * 100 = -16.0 %
      
      const roe = computeReturnOnEquity(1000_00, 500_000_00, 4.0, 50_000_00);
      expect(roe).toBe(-16.0);
    });
  });

  describe("getChurchTaxRateForState", () => {
    it("returns 8 for BY and BW", () => {
      expect(getChurchTaxRateForState("BY")).toBe(8);
      expect(getChurchTaxRateForState("BW")).toBe(8);
    });

    it("returns 9 for other states", () => {
      expect(getChurchTaxRateForState("NW")).toBe(9);
      expect(getChurchTaxRateForState("BE")).toBe(9);
      expect(getChurchTaxRateForState("HH")).toBe(9);
    });
  });

  describe("computeEffectiveTaxRate", () => {
    it("returns fixed rate for GmbH", () => {
      expect(computeEffectiveTaxRate("gmbh", 42, true, true, 9)).toBe(15.825);
    });

    it("returns fixed rate for gewerblich", () => {
      expect(computeEffectiveTaxRate("gewerblich", 42, false, false, 8)).toBe(30.0);
    });

    it("calculates privat tax rate correctly based on AC", () => {
      // 42 + 2.31 + 3.78 = 48.09
      expect(computeEffectiveTaxRate("privat", 42, true, true, 9)).toBeCloseTo(48.09, 2);
    });

    it("handles privat with no soli and no church tax", () => {
      expect(computeEffectiveTaxRate("privat", 42, false, false, 9)).toBe(42.0);
    });

    it("handles privat with only soli", () => {
      // 42 + (42 * 0.055) = 44.31
      expect(computeEffectiveTaxRate("privat", 42, true, false, 9)).toBeCloseTo(44.31, 2);
    });
  });

  describe("computeAfaBasis (AC-1, AC-2)", () => {
    it("computes AfA basis with building share", () => {
      // 500.000 € purchase + 0 € ancillary, 80% building share, 0 renovation
      // → 400.000 € = 40_000_000 cents
      expect(computeAfaBasis(50_000_000, 0, 0, 80)).toBe(40_000_000);
    });

    it("includes ancillary costs in the basis", () => {
      // 500.000 € purchase + 50.000 € ancillary = 550.000 €
      // 80% of 550.000 = 440.000 €
      expect(computeAfaBasis(50_000_000, 5_000_000, 0, 80)).toBe(44_000_000);
    });

    it("adds renovation costs on top of building portion (AC-2)", () => {
      // 500.000 € purchase + 0 ancillary, 80% = 400.000 €
      // + 25.000 € renovation = 425.000 €
      expect(computeAfaBasis(50_000_000, 0, 2_500_000, 80)).toBe(42_500_000);
    });

    it("handles 0% building share", () => {
      expect(computeAfaBasis(50_000_000, 5_000_000, 1_000_000, 0)).toBe(1_000_000);
    });

    it("handles 100% building share", () => {
      expect(computeAfaBasis(50_000_000, 5_000_000, 0, 100)).toBe(55_000_000);
    });
  });

  describe("computeAnnualDepreciation (AC-2)", () => {
    it("computes annual depreciation at 2%", () => {
      // 425.000 € × 2% = 8.500 €
      expect(computeAnnualDepreciation(42_500_000, 2.0)).toBe(850_000);
    });

    it("computes annual depreciation at 3%", () => {
      // 400.000 € × 3% = 12.000 €
      expect(computeAnnualDepreciation(40_000_000, 3.0)).toBe(1_200_000);
    });

    it("returns 0 for 0% rate", () => {
      expect(computeAnnualDepreciation(40_000_000, 0)).toBe(0);
    });
  });

  describe("computeTaxShield (AC-3)", () => {
    it("computes tax shield correctly", () => {
      // 8.000 € depreciation × 42% tax rate = 3.360 €
      expect(computeTaxShield(800_000, 42)).toBe(336_000);
    });

    it("handles 0 depreciation", () => {
      expect(computeTaxShield(0, 42)).toBe(0);
    });

    it("handles 0% tax rate", () => {
      expect(computeTaxShield(800_000, 0)).toBe(0);
    });
  });
});
