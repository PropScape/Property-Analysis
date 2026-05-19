import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * - Runs tests from the `e2e/` directory.
 * - Auto-starts the dev server on port 3000.
 * - Chromium-only for MVP (extend to Firefox/Safari later).
 *
 * See ADR-006 for testing strategy.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
