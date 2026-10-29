import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

/**
 * Accessibility spec for ConfigDetail — every story, including the edge states (chooser, partial
 * record, empty, disabled actions). Each test first asserts the state the story claims to show,
 * then requires zero axe violations inside #storybook-root.
 *
 * Story URL convention: /iframe.html?id=display-configdetail--<slug>&viewMode=story
 */

const open = (page: Page, slug: string) =>
  page.goto(`/iframe.html?id=display-configdetail--${slug}&viewMode=story`);

async function noViolations(page: Page) {
  const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
  expect(results.violations).toHaveLength(0);
}

test.describe("ConfigDetail — axe-core accessibility", () => {
  test("Default: one action enabled, the one shipped disabled is disabled", async ({ page }) => {
    await open(page, "default");
    await page.getByRole("article").first().waitFor({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Co-owners" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Syndic mandates" })).toBeDisabled();
    await noViolations(page);
  });

  test("French: labels and formats", async ({ page }) => {
    await open(page, "french");
    await page.getByRole("button", { name: "Copropriétaires" }).waitFor({ timeout: 10_000 });
    await noViolations(page);
  });

  test("Chooser: one button per record before any detail", async ({ page }) => {
    await open(page, "chooser");
    await page.getByRole("button", { name: /Le Clos des Vignes/ }).waitFor({ timeout: 10_000 });
    await expect(page.getByRole("article")).toHaveCount(0);
    await noViolations(page);
  });

  test("Partial: a record with absent values still renders", async ({ page }) => {
    await open(page, "partial");
    await page.getByRole("article").first().waitFor({ timeout: 10_000 });
    await expect(page.getByRole("alert")).toHaveCount(0);
    await noViolations(page);
  });

  test("Empty: the empty message", async ({ page }) => {
    await open(page, "empty");
    await page.locator("#storybook-root p").first().waitFor({ timeout: 10_000 });
    await expect(page.getByRole("article")).toHaveCount(0);
    await noViolations(page);
  });

  test("NoBridge: every action renders disabled", async ({ page }) => {
    await open(page, "no-bridge");
    await page.getByRole("article").first().waitFor({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Co-owners" })).toBeDisabled();
    await noViolations(page);
  });
});
