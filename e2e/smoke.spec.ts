import { test, expect } from "@playwright/test";

/**
 * Smoke test — verifies the application loads and renders correctly.
 * This is the baseline E2E test that must always pass.
 */
test.describe("Smoke test", () => {
  test("homepage loads and displays PropScape branding", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/PropScape/);
    await expect(page.getByText("PropScape").first()).toBeVisible();
  });
});
