/**
 * Unit tests for the Step 1 Zod schema.
 *
 * Spec: SPEC-WIZARD-START v1.0.0 §5 (acceptance criteria 5.1).
 */
import { describe, it, expect } from "vitest";
import { step1Schema } from "@/domain/schemas/step1";

describe("step1Schema", () => {
  // ── Valid inputs ─────────────────────────────────────────────────────────

  it("accepts all valid intent + experience combinations", () => {
    const intents = ["buy_to_rent", "buy_to_live", "flip"] as const;
    const experiences = ["beginner", "intermediate", "expert"] as const;

    for (const intent of intents) {
      for (const experience_level of experiences) {
        const result = step1Schema.safeParse({ intent, experience_level });
        expect(result.success, `${intent} + ${experience_level}`).toBe(true);
      }
    }
  });

  it("returns typed data on success", () => {
    const result = step1Schema.safeParse({
      intent: "buy_to_rent",
      experience_level: "beginner",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        intent: "buy_to_rent",
        experience_level: "beginner",
      });
    }
  });

  // ── Invalid inputs ────────────────────────────────────────────────────────

  it("rejects an invalid intent value", () => {
    const result = step1Schema.safeParse({
      intent: "commercial",
      experience_level: "beginner",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Bitte wählen Sie eine Investitionsart aus."
      );
    }
  });

  it("rejects an invalid experience_level value", () => {
    const result = step1Schema.safeParse({
      intent: "flip",
      experience_level: "guru",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Bitte wählen Sie Ihr Erfahrungsniveau aus."
      );
    }
  });

  it("rejects missing intent", () => {
    const result = step1Schema.safeParse({ experience_level: "beginner" });
    expect(result.success).toBe(false);
  });

  it("rejects missing experience_level", () => {
    const result = step1Schema.safeParse({ intent: "buy_to_live" });
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = step1Schema.safeParse({});
    expect(result.success).toBe(false);
  });
});
