import { describe, it, expect } from "vitest";
import { computeOperatingCostsBreakdown } from "@/domain/calculations/operating-costs";
import type { Step7Data } from "@/domain/types/wizard";

describe("computeOperatingCostsBreakdown", () => {
  const mockData: Step7Data = {
    recoverable_costs_per_month_cents: 220_00,
    non_recoverable_costs_per_month_cents: 130_00,
    property_management_fee_per_month_cents: 25_00,
    maintenance_reserve_per_month_cents: 50_00,
    additional_insurance_per_year_cents: 120_00,
    other_costs_per_year_cents: 0,
  };

  const COLD_RENT_MONTHLY = 1000_00; // 1.000 € / month = 12.000 € p.a.

  it("calculates monthly owner costs correctly", () => {
    const result = computeOperatingCostsBreakdown(mockData, COLD_RENT_MONTHLY);
    // 130 + 25 + 50 = 205 €
    expect(result.ownerCostsPerMonthCents).toBe(205_00);
  });

  it("calculates annual running and one-off costs correctly", () => {
    const result = computeOperatingCostsBreakdown(mockData, COLD_RENT_MONTHLY);
    // Running: 205 * 12 = 2460 €
    expect(result.annualRunningCostsCents).toBe(2460_00);
    // One-off: 120 + 0 = 120 €
    expect(result.annualOneOffCostsCents).toBe(120_00);
    // Total: 2460 + 120 = 2580 €
    expect(result.totalAnnualCostsCents).toBe(2580_00);
  });

  it("calculates cost ratio correctly", () => {
    const result = computeOperatingCostsBreakdown(mockData, COLD_RENT_MONTHLY);
    // Annual rent = 12.000 €
    // Total costs = 2.580 €
    // Ratio = 2580 / 12000 = 21.5%
    expect(result.costRatioPercent).toBe(21.5);
  });

  it("returns 0 ratio if cold rent is 0", () => {
    const result = computeOperatingCostsBreakdown(mockData, 0);
    expect(result.costRatioPercent).toBe(0);
  });
});
