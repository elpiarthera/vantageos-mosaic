import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

/**
 * Accessibility spec for ConfigList — every story, including the edge states (empty, partial
 * totals, disabled actions, refusal). Each test first asserts the state the story claims to show,
 * then requires zero axe violations inside #storybook-root.
 *
 * Story URL convention: /iframe.html?id=display-configlist--<slug>&viewMode=story
 */

const open = (page: Page, slug: string) =>
  page.goto(`/iframe.html?id=display-configlist--${slug}&viewMode=story`);

async function noViolations(page: Page) {
  const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
  expect(results.violations).toHaveLength(0);
}

test.describe("ConfigList — axe-core accessibility", () => {
  test("Default: table, enabled Load more and row actions", async ({ page }) => {
    await open(page, "default");
    await page.getByRole("table").first().waitFor({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Load more" })).toBeEnabled();
    await noViolations(page);
  });

  test("French: labels from the config", async ({ page }) => {
    await open(page, "french");
    await page.getByRole("heading", { name: "Contrats locataires" }).waitFor({ timeout: 10_000 });
    await noViolations(page);
  });

  test("Empty: the configured empty message, no table", async ({ page }) => {
    await open(page, "empty");
    await page.getByText("No contract matches these filters.").waitFor({ timeout: 10_000 });
    await expect(page.getByRole("table")).toHaveCount(0);
    await noViolations(page);
  });

  test("PartialTotals: incomplete-totals and truncation notices", async ({ page }) => {
    await open(page, "partial-totals");
    await page.getByRole("status").first().waitFor({ timeout: 10_000 });
    await expect(page.getByRole("status").first()).toContainText("First 2 of 140 contracts");
    await expect(page.getByText("Results are truncated")).toHaveCount(1);
    await noViolations(page);
  });

  test("NoBridge: paging and row actions render disabled", async ({ page }) => {
    await open(page, "no-bridge");
    await page.getByRole("table").first().waitFor({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Load more" })).toBeDisabled();
    await noViolations(page);
  });

  test("InvalidConfig: a visible refusal, no table", async ({ page }) => {
    await open(page, "invalid-config");
    await page.getByRole("alert").waitFor({ timeout: 10_000 });
    await expect(page.getByRole("table")).toHaveCount(0);
    await noViolations(page);
  });
});
