import { describe, it, expect } from "vitest";
import { step7Schema } from "@/domain/schemas/step7";

const validPayload = {
  recoverable_costs_per_month_cents: 220_00,
  non_recoverable_costs_per_month_cents: 130_00,
  property_management_fee_per_month_cents: 25_00,
  maintenance_reserve_per_month_cents: 50_00,
  additional_insurance_per_year_cents: 120_00,
  other_costs_per_year_cents: 0,
};

describe("step7Schema", () => {
  it("accepts a valid payload", () => {
    expect(step7Schema.safeParse(validPayload).success).toBe(true);
  });

  it("accepts all zeros", () => {
    const result = step7Schema.safeParse({
      recoverable_costs_per_month_cents: 0,
      non_recoverable_costs_per_month_cents: 0,
      property_management_fee_per_month_cents: 0,
      maintenance_reserve_per_month_cents: 0,
      additional_insurance_per_year_cents: 0,
      other_costs_per_year_cents: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative values", () => {
    const result = step7Schema.safeParse({
      ...validPayload,
      non_recoverable_costs_per_month_cents: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integers", () => {
    const result = step7Schema.safeParse({
      ...validPayload,
      maintenance_reserve_per_month_cents: 50.5,
    });
    expect(result.success).toBe(false);
  });
});
