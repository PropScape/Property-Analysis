import { test, expect } from "@playwright/test";

/**
 * Smoke test — verifies the application loads and renders correctly.
 * This is the baseline E2E test that must always pass.
 */
test.describe("Smoke test", () => {
  test("homepage loads and displays Immoverse branding", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Immoverse/);
    await expect(page.getByText("Immoverse").first()).toBeVisible();
  });
});
