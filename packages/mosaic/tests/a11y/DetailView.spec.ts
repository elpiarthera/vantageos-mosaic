import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

/**
 * Accessibility spec for DetailView — every story, including the edge states (partial record,
 * empty, loading, invalid props). Each test first asserts the state the story claims to show,
 * then requires zero axe violations inside #storybook-root.
 *
 * Story URL convention: /iframe.html?id=display-detailview--<slug>&viewMode=story
 */

const open = (page: Page, slug: string) =>
  page.goto(`/iframe.html?id=display-detailview--${slug}&viewMode=story`);

async function noViolations(page: Page) {
  const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
  expect(results.violations).toHaveLength(0);
}

test.describe("DetailView — axe-core accessibility", () => {
  test("Default: labelled article with a nested table", async ({ page }) => {
    await open(page, "default");
    await page.getByRole("article").first().waitFor({ timeout: 10_000 });
    await expect(page.getByRole("table")).toHaveCount(1);
    await noViolations(page);
  });

  test("French: localised chrome", async ({ page }) => {
    await open(page, "french");
    await page.getByRole("article").first().waitFor({ timeout: 10_000 });
    await noViolations(page);
  });

  test("Partial: absent values and an empty nested table", async ({ page }) => {
    await open(page, "partial");
    await page.getByRole("article").first().waitFor({ timeout: 10_000 });
    await expect(page.getByRole("alert")).toHaveCount(0);
    await noViolations(page);
  });

  test("Empty: no article, an empty state", async ({ page }) => {
    await open(page, "empty");
    await page.locator("#storybook-root *").first().waitFor({ timeout: 10_000 });
    await expect(page.getByRole("article")).toHaveCount(0);
    await noViolations(page);
  });

  test("Loading: a busy Skeleton", async ({ page }) => {
    await open(page, "loading");
    await page.locator('[aria-busy="true"]').first().waitFor({ timeout: 10_000 });
    await noViolations(page);
  });

  test("InvalidProps: an alert", async ({ page }) => {
    await open(page, "invalid-props");
    await page.getByRole("alert").waitFor({ timeout: 10_000 });
    await noViolations(page);
  });
});
