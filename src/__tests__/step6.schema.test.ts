import { describe, it, expect } from "vitest";
import { step6Schema } from "@/domain/schemas/step6";

const validPayload = {
  equity_cents: 100_000_000,
  loan_interest_rate_percent: 3.8,
  loan_repayment_rate_percent: 2.0,
  loan_fixation_years: 10 as const,
  loan_processing_fee_cents: 0,
};

describe("step6Schema", () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  it("accepts a valid payload", () => {
    expect(step6Schema.safeParse(validPayload).success).toBe(true);
  });

  it("accepts zero equity", () => {
    const result = step6Schema.safeParse({ ...validPayload, equity_cents: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts zero interest and repayment", () => {
    const result = step6Schema.safeParse({
      ...validPayload,
      loan_interest_rate_percent: 0,
      loan_repayment_rate_percent: 0,
    });
    expect(result.success).toBe(true);
  });

  // ── Equity validation ──────────────────────────────────────────────────────

  it("rejects a negative equity", () => {
    const result = step6Schema.safeParse({
      ...validPayload,
      equity_cents: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer equity", () => {
    const result = step6Schema.safeParse({
      ...validPayload,
      equity_cents: 100.5,
    });
    expect(result.success).toBe(false);
  });

  // ── Rate validation ────────────────────────────────────────────────────────

  it("rejects interest rate > 20%", () => {
    const result = step6Schema.safeParse({
      ...validPayload,
      loan_interest_rate_percent: 20.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects repayment rate > 20%", () => {
    const result = step6Schema.safeParse({
      ...validPayload,
      loan_repayment_rate_percent: 20.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid fixation years", () => {
    const result = step6Schema.safeParse({
      ...validPayload,
      loan_fixation_years: 12, // Not in [5, 10, 15, 20]
    });
    expect(result.success).toBe(false);
  });

  // ── Processing fee ─────────────────────────────────────────────────────────

  it("rejects negative processing fee", () => {
    const result = step6Schema.safeParse({
      ...validPayload,
      loan_processing_fee_cents: -1,
    });
    expect(result.success).toBe(false);
  });
});
