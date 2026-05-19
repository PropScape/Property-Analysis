import { describe, it, expect } from "vitest";
import { ok, err } from "@/domain";
import type { Result } from "@/domain";

describe("Result pattern", () => {
  it("ok() creates a successful result with data", () => {
    const result: Result<number> = ok(42);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(42);
    }
  });

  it("err() creates a failed result with error message", () => {
    const result: Result<number> = err("Something went wrong");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Something went wrong");
    }
  });

  it("ok() preserves complex data structures", () => {
    const data = { monthlyCashflowCents: 22400, annualCashflowCents: 268800 };
    const result = ok(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });
});
