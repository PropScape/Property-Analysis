import { describe, it, expect } from "vitest";
import { computeFinancingBreakdown } from "@/domain/calculations/financing";

describe("computeFinancingBreakdown", () => {
  const TOTAL = 40_000_000; // 400.000 €

  it("calculates loan amount and LTV correctly", () => {
    const result = computeFinancingBreakdown(10_000_000, TOTAL, 3.8, 2.0);
    expect(result.loanAmountCents).toBe(30_000_000); // 300.000 €
    expect(result.ltvPercent).toBe(75);
  });

  it("caps loan amount at 0 if equity exceeds total investment", () => {
    const result = computeFinancingBreakdown(50_000_000, TOTAL, 3.8, 2.0);
    expect(result.loanAmountCents).toBe(0);
    expect(result.ltvPercent).toBe(0);
    expect(result.monthlyPaymentCents).toBe(0);
  });

  it("handles 100% financing (0 equity)", () => {
    const result = computeFinancingBreakdown(0, TOTAL, 3.8, 2.0);
    expect(result.loanAmountCents).toBe(40_000_000);
    expect(result.ltvPercent).toBe(100);
  });

  it("calculates monthly payment correctly using German annuity formula", () => {
    // 300,000 € loan, 3.8% interest, 2.0% repayment = 5.8% total annual
    // Annual payment = 300,000 * 0.058 = 17,400 €
    // Monthly payment = 17,400 / 12 = 1,450 € = 145.000 cents
    const result = computeFinancingBreakdown(10_000_000, TOTAL, 3.8, 2.0);
    expect(result.monthlyPaymentCents).toBe(145_000);
  });

  it("estimates years to payoff correctly (standard case)", () => {
    // 3.8% interest, 2.0% repayment
    // n = ln(1 + 0.038/0.02) / ln(1 + 0.038) = ln(2.9) / ln(1.038) ≈ 28.5 years
    const result = computeFinancingBreakdown(10_000_000, TOTAL, 3.8, 2.0);
    expect(result.yearsToPayoff).toBe(28.5);
  });

  it("estimates years to payoff correctly (0% interest)", () => {
    // 0% interest, 2.0% repayment = 100 / 2 = 50 years
    const result = computeFinancingBreakdown(10_000_000, TOTAL, 0, 2.0);
    expect(result.yearsToPayoff).toBe(50);
  });

  it("returns 0 years to payoff if repayment is 0", () => {
    const result = computeFinancingBreakdown(10_000_000, TOTAL, 3.8, 0);
    expect(result.yearsToPayoff).toBe(0);
  });
});
