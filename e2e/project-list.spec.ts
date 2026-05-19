import { test, expect } from "@playwright/test";

/**
 * E2E tests for the project overview page.
 *
 * Implements verification for SPEC-PROJECT-LIST v1.0.0 acceptance criteria.
 */
test.describe("Project Overview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays page title and subtitle", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Meine Analysen" })
    ).toBeVisible();
    await expect(
      page.getByText("Verwalten Sie Ihre Immobilien-Investmentanalysen")
    ).toBeVisible();
  });

  test("displays Neue Analyse button", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /Neue Analyse/i })
    ).toBeVisible();
  });

  test("displays summary stat cards", async ({ page }) => {
    // Use exact matching and .first() to avoid ambiguity with
    // text that also appears in heading/badges
    await expect(
      page.getByText("Analysen", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Abgeschlossen", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("Entwurf", { exact: true }).first()
    ).toBeVisible();
  });

  test("displays analysis cards with names", async ({ page }) => {
    await expect(
      page.getByText("Eigentumswohnung München Schwabing")
    ).toBeVisible();
    await expect(
      page.getByText("Mehrfamilienhaus Berlin Mitte")
    ).toBeVisible();
    await expect(
      page.getByText("Altbauwohnung Hamburg Eppendorf")
    ).toBeVisible();
  });

  test("displays KPI values for completed analyses", async ({ page }) => {
    // Check that Kaufpreis labels appear (one per completed card)
    const kpiLabels = page.getByText("Kaufpreis");
    await expect(kpiLabels.first()).toBeVisible();
  });

  test("navigates to /analysis/new when CTA is clicked", async ({ page }) => {
    await page.getByRole("link", { name: /Neue Analyse/i }).first().click();
    await expect(page).toHaveURL(/\/analysis\/new/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Neue Analyse" })
    ).toBeVisible();
  });

  test("delete confirmation dialog appears", async ({ page }) => {
    // Click the delete button on the first analysis card
    const deleteButton = page.getByLabel(/löschen/i).first();
    await deleteButton.click();

    // Dialog should appear
    await expect(page.getByText("Analyse löschen?")).toBeVisible();
    await expect(page.getByText("Abbrechen")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Löschen" })
    ).toBeVisible();
  });

  test("delete confirmation removes the analysis card", async ({ page }) => {
    // Count initial cards by a unique per-card element
    const initialCards = await page.getByText(/Zuletzt bearbeitet/).count();

    // Delete the first analysis
    const deleteButton = page.getByLabel(/löschen/i).first();
    await deleteButton.click();
    await page.getByRole("button", { name: "Löschen" }).click();

    // One fewer card should remain
    await expect(page.getByText(/Zuletzt bearbeitet/)).toHaveCount(
      initialCards - 1
    );
  });
});
