import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Wizard Start flow.
 *
 * @remarks
 * Covers acceptance criteria from SPEC-WIZARD-START v1.0.0 §3.
 *
 * NOTE: Tests that require a real Supabase session (create analysis)
 * are tagged with @live and skipped in CI.
 *
 * Route-protection tests (AC-1) run unauthenticated and are always active.
 */

// ---------------------------------------------------------------------------
// Route protection (AC-1) — no auth required
// ---------------------------------------------------------------------------

test.describe("Wizard route protection", () => {
  test("AC-1: unauthenticated user visiting /analysis/new is redirected to /auth/login", async ({
    page,
  }) => {
    await page.goto("/analysis/new");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("AC-1: unauthenticated user visiting a wizard step is redirected to /auth/login", async ({
    page,
  }) => {
    await page.goto("/analysis/some-fake-id/step/1");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// /analysis/new page — name prompt form (AC-2)
// Requires: authenticated session (@live)
// ---------------------------------------------------------------------------

test.describe("Name prompt page @live", () => {
  test.skip(
    process.env.CI === "true",
    "Skipped in CI — requires Supabase session"
  );

  test("AC-2: /analysis/new renders the name-prompt form", async ({ page }) => {
    await page.goto("/analysis/new");

    // Page title
    await expect(page).toHaveTitle(/Neue Analyse/);

    // H1 heading
    await expect(page.getByRole("heading", { name: "Neue Analyse" })).toBeVisible();

    // Name input
    const nameInput = page.locator("#new-analysis-name");
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeFocused();

    // Submit button
    await expect(page.locator("#new-analysis-submit")).toBeVisible();
  });

  test("AC-2a: submitting empty name shows validation error", async ({
    page,
  }) => {
    await page.goto("/analysis/new");

    await page.locator("#new-analysis-submit").click();

    // HTML5 required validation fires before the Server Action
    // (constraint validation API — no network call needed)
    const nameInput = page.locator("#new-analysis-name");
    await expect(nameInput).toHaveAttribute("required");
  });

  test("AC-2b: back link returns to project overview", async ({ page }) => {
    await page.goto("/analysis/new");

    await page.locator("#new-analysis-back-link").click();
    await expect(page).toHaveURL("/");
  });
});

// ---------------------------------------------------------------------------
// Analysis creation + wizard shell (AC-3, AC-4)
// Requires: authenticated session + DB (@live)
// ---------------------------------------------------------------------------

test.describe("Wizard shell @live", () => {
  test.skip(
    process.env.CI === "true",
    "Skipped in CI — requires Supabase session + DB"
  );

  test("AC-3: submitting a valid name creates an analysis and lands on step 1", async ({
    page,
  }) => {
    await page.goto("/analysis/new");

    await page.locator("#new-analysis-name").fill("E2E Test Analyse");
    await page.locator("#new-analysis-submit").click();

    // Should redirect to /analysis/[id]/step/1
    await expect(page).toHaveURL(/\/analysis\/[^/]+\/step\/1/);
    await expect(page).toHaveTitle(/Schritt 1/);
  });

  test("AC-4: wizard shell shows the analysis name and step 1 in the stepper", async ({
    page,
  }) => {
    await page.goto("/analysis/new");
    await page.locator("#new-analysis-name").fill("Stepper Test");
    await page.locator("#new-analysis-submit").click();

    await page.waitForURL(/\/analysis\/[^/]+\/step\/1/);

    // Wizard stepper should be visible
    await expect(page.getByRole("navigation", { name: "Wizard-Fortschritt" })).toBeVisible();

    // Step 1 should be marked as active (aria-current="step")
    const activeStep = page.locator('[aria-current="step"]');
    await expect(activeStep).toBeVisible();
    await expect(activeStep).toContainText("1");
  });

  test("AC-5: Step 1 form shows intent and experience sections", async ({
    page,
  }) => {
    await page.goto("/analysis/new");
    await page.locator("#new-analysis-name").fill("Step1 Test");
    await page.locator("#new-analysis-submit").click();

    await page.waitForURL(/\/analysis\/[^/]+\/step\/1/);

    await expect(page.getByRole("heading", { name: "Was ist Ihr Ziel?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wie erfahren sind Sie?" })).toBeVisible();
  });

  test("AC-5a: selecting intent + experience enables Weiter and navigates to step 2 (404)", async ({
    page,
  }) => {
    await page.goto("/analysis/new");
    await page.locator("#new-analysis-name").fill("Navigate Test");
    await page.locator("#new-analysis-submit").click();
    await page.waitForURL(/\/analysis\/[^/]+\/step\/1/);

    // Select intent: Kapitalanlage
    await page.getByRole("radio", { name: /Kapitalanlage/ }).check();
    // Select experience: Einsteiger
    await page.getByRole("radio", { name: /Einsteiger/ }).check();

    // Click Weiter
    await page.locator("#wizard-step-next").click();

    // Step 2 is not implemented — expect 404
    await expect(page).toHaveURL(/\/step\/2/);
  });
});
