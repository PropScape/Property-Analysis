import { describe, it, expect } from "vitest";
import {
  parseToCents,
  formatCentsPlain,
  formatCentsEur,
  applyPercent,
} from "@/domain/calculations/currency";

describe("parseToCents", () => {
  it("parses a plain integer string", () => {
    expect(parseToCents("350000")).toBe(35_000_000);
  });

  it("parses a German-format thousand-separated string", () => {
    expect(parseToCents("350.000")).toBe(35_000_000);
  });

  it("parses a German-format string with comma decimal", () => {
    expect(parseToCents("1.250,50")).toBe(125_050);
  });

  it("returns null for an empty string", () => {
    expect(parseToCents("")).toBeNull();
  });

  it("returns null for a non-numeric string", () => {
    expect(parseToCents("abc")).toBeNull();
  });

  it("returns null for whitespace only", () => {
    expect(parseToCents("   ")).toBeNull();
  });

  it("rounds to nearest cent", () => {
    // 1.234 EUR → 123.4 cents → 123 cents
    expect(parseToCents("1,234")).toBe(123);
  });
});

describe("formatCentsPlain", () => {
  it("formats whole euros without decimals", () => {
    expect(formatCentsPlain(35_000_000)).toBe("350.000");
  });

  it("formats small amounts", () => {
    expect(formatCentsPlain(100)).toBe("1");
  });

  it("rounds fractional cents", () => {
    expect(formatCentsPlain(150)).toBe("2");
  });
});

describe("formatCentsEur", () => {
  it("includes the € symbol", () => {
    expect(formatCentsEur(35_000_000)).toContain("€");
  });

  it("uses German locale (dot as thousand separator)", () => {
    expect(formatCentsEur(35_000_000)).toContain("350.000");
  });
});

describe("applyPercent", () => {
  it("computes 3.57% of 350 000 €", () => {
    expect(applyPercent(35_000_000, 3.57)).toBe(1_249_500);
  });

  it("returns 0 for 0% or 0 amount", () => {
    expect(applyPercent(35_000_000, 0)).toBe(0);
    expect(applyPercent(0, 3.57)).toBe(0);
  });

  it("rounds to integer cents", () => {
    // 1 cent × 50% = 0.5 → rounds to 1
    expect(applyPercent(1, 50)).toBe(1);
  });
});
