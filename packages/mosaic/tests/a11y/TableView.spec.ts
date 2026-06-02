import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility spec for TableView — Default + Empty stories.
 * Runs against Storybook static build. Zero axe violations required.
 *
 * Story URL convention: /iframe.html?id=display-tableview--<slug>&viewMode=story
 */

test.describe("TableView — axe-core accessibility", () => {
  test("Default story (200 static rows) has no a11y violations", async ({ page }) => {
    await page.goto("/iframe.html?id=display-tableview--default&viewMode=story");
    // Wait for the table to be visible
    await page.waitForSelector('[role="table"]', { timeout: 10_000 });

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toHaveLength(0);
  });

  test("Empty story (Observable emits []) has no a11y violations", async ({ page }) => {
    await page.goto("/iframe.html?id=display-tableview--empty&viewMode=story");
    // Wait for the table to be present (empty state renders the table with 0 data rows)
    await page.waitForSelector('[role="table"]', { timeout: 10_000 });

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toHaveLength(0);
  });
});
