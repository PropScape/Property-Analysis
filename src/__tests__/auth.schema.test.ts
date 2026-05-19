import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/domain/auth/auth.schema";

/**
 * Unit tests for auth Zod schemas.
 *
 * @remarks
 * Validates all acceptance criteria from SPEC-AUTH v1.0.0 §5.
 * Tests both the happy path and every error branch.
 * Uses Zod v4 API: result.error.issues (not .errors).
 */
describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.de",
      password: "geheim123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "geheim123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Ungültige E-Mail-Adresse.");
    }
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.de",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Passwort erforderlich.");
    }
  });
});

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "neu@example.de",
      password: "sicher99",
      confirmPassword: "sicher99",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "neu@example.de",
      password: "kurz",
      confirmPassword: "kurz",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Mindestens 8 Zeichen erforderlich."
      );
    }
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      email: "neu@example.de",
      password: "sicher99",
      confirmPassword: "anders99",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find(
        (e) => e.path[0] === "confirmPassword"
      );
      expect(err?.message).toBe("Passwörter stimmen nicht überein.");
    }
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      email: "kein-email",
      password: "sicher99",
      confirmPassword: "sicher99",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Ungültige E-Mail-Adresse.");
    }
  });

  it("rejects an empty confirmPassword", () => {
    const result = registerSchema.safeParse({
      email: "neu@example.de",
      password: "sicher99",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
