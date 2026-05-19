import { describe, it, expect } from "vitest";
import { computeReturnOnEquity } from "@/domain/calculations/tax-kpis";

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
});
