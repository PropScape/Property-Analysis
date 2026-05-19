import { describe, it, expect } from "vitest";
import { computeInitialCashflow } from "@/domain/calculations/cashflow";

describe("computeInitialCashflow", () => {
  it("computes a positive cashflow correctly", () => {
    // Kaltmiete: 1250, Owner Costs: 215, Debt: 690 -> 1250 - 215 - 690 = 345
    const result = computeInitialCashflow(1250_00, 215_00, 690_00);
    
    expect(result.monthlyCashflowCents).toBe(345_00);
    expect(result.isPositive).toBe(true);
  });

  it("computes a negative cashflow correctly", () => {
    // Kaltmiete: 1000, Owner Costs: 300, Debt: 800 -> 1000 - 300 - 800 = -100
    const result = computeInitialCashflow(1000_00, 300_00, 800_00);
    
    expect(result.monthlyCashflowCents).toBe(-100_00);
    expect(result.isPositive).toBe(false);
  });

  it("handles exact zero cashflow", () => {
    // Kaltmiete: 1000, Owner Costs: 200, Debt: 800 -> 1000 - 200 - 800 = 0
    const result = computeInitialCashflow(1000_00, 200_00, 800_00);
    
    expect(result.monthlyCashflowCents).toBe(0);
    expect(result.isPositive).toBe(false); // 0 is not positive
  });
});
