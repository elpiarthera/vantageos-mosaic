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
    // Wait for the table to be visible. TableView renders a native <table>
    // (implicit ARIA role "table"), so use getByRole — a CSS [role="table"]
    // selector does not match the implicit role and would time out.
    await page.getByRole("table").first().waitFor({ timeout: 10_000 });

    const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
    expect(results.violations).toHaveLength(0);
  });

  test("Empty story (Observable emits []) has no a11y violations", async ({ page }) => {
    await page.goto("/iframe.html?id=display-tableview--empty&viewMode=story");
    // Wait for the table to be present (empty state renders the table with 0
    // data rows). Use getByRole to match the native <table> implicit role.
    await page.getByRole("table").first().waitFor({ timeout: 10_000 });

    const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
    expect(results.violations).toHaveLength(0);
  });
});
