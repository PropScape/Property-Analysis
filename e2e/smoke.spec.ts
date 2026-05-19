import { test, expect } from "@playwright/test";

/**
 * Smoke test — verifies the application loads and renders correctly.
 *
 * @remarks
 * Navigates to /auth/login (the public entry point) since / now requires auth.
 * This is the baseline E2E test that must always pass in CI.
 */
test.describe("Smoke test", () => {
  test("app loads and displays PropScape branding", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page).toHaveTitle(/PropScape/);
    await expect(page.getByText("PropScape").first()).toBeVisible();
  });
});
