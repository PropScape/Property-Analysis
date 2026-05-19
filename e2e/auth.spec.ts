import { test, expect } from "@playwright/test";

/**
 * E2E tests for authentication flows.
 *
 * @remarks
 * Covers acceptance criteria from SPEC-AUTH v1.0.0 §3.
 * Tests run against the local Next.js dev server (see playwright.config.ts).
 *
 * NOTE: Tests that require actual Supabase Auth (login/register) are tagged
 * with @live and skipped in CI where no real credentials exist.
 * Route-protection tests run without credentials and are always active.
 */

test.describe("Route protection", () => {
  test("unauthenticated user visiting / is redirected to /auth/login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("unauthenticated user visiting a deep path is redirected to /auth/login", async ({
    page,
  }) => {
    await page.goto("/analysis/some-id");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("renders the login form", async ({ page }) => {
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.locator("#login-submit")).toBeVisible();
  });

  test("shows email validation error for invalid email", async ({ page }) => {
    await page.fill("#login-email", "not-an-email");
    await page.fill("#login-password", "anypassword");
    await page.click("#login-submit");
    await expect(page.locator("#login-email-error")).toBeVisible();
    await expect(page.locator("#login-email-error")).toContainText(
      "Ungültige E-Mail-Adresse"
    );
  });

  test("shows password required error when empty", async ({ page }) => {
    await page.fill("#login-email", "user@example.de");
    await page.click("#login-submit");
    await expect(page.locator("#login-password-error")).toBeVisible();
  });

  test("has a link to the register page", async ({ page }) => {
    await page.click("text=Registrieren →");
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});

test.describe("Register page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/register");
  });

  test("renders the register form", async ({ page }) => {
    await expect(page.locator("#register-email")).toBeVisible();
    await expect(page.locator("#register-password")).toBeVisible();
    await expect(page.locator("#register-confirm-password")).toBeVisible();
    await expect(page.locator("#register-submit")).toBeVisible();
  });

  test("shows error for password shorter than 8 chars", async ({ page }) => {
    await page.fill("#register-email", "neu@example.de");
    await page.fill("#register-password", "kurz");
    await page.fill("#register-confirm-password", "kurz");
    await page.click("#register-submit");
    await expect(page.locator("#register-password-error")).toBeVisible();
    await expect(page.locator("#register-password-error")).toContainText(
      "Mindestens 8 Zeichen"
    );
  });

  test("shows error for mismatched passwords", async ({ page }) => {
    await page.fill("#register-email", "neu@example.de");
    await page.fill("#register-password", "sicher123");
    await page.fill("#register-confirm-password", "anders456");
    await page.click("#register-submit");
    await expect(
      page.locator("#register-confirm-password-error")
    ).toBeVisible();
    await expect(
      page.locator("#register-confirm-password-error")
    ).toContainText("stimmen nicht überein");
  });

  test("has a link back to the login page", async ({ page }) => {
    await page.click("text=Anmelden →");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe("Verify email page", () => {
  test("is publicly accessible without a session", async ({ page }) => {
    await page.goto("/auth/verify-email");
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    await expect(page.getByRole("heading", { name: "E-Mail bestätigen" })).toBeVisible();
  });
});
