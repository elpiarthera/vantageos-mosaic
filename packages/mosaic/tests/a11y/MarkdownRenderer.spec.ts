import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("MarkdownRenderer — default story has no a11y violations", async ({ page }) => {
  await page.goto("/storybook/?story=artifacts-markdownrenderer--default");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});

test("MarkdownRenderer — error story renders accessible alert", async ({ page }) => {
  await page.goto("/storybook/?story=artifacts-markdownrenderer--error");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});

test("MarkdownRenderer — empty story has no a11y violations", async ({ page }) => {
  await page.goto("/storybook/?story=artifacts-markdownrenderer--empty");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});

test("MarkdownRenderer — article has correct lang attribute", async ({ page }) => {
  await page.goto("/storybook/?story=artifacts-markdownrenderer--default");
  const article = page.getByRole("article");
  await expect(article).toBeVisible();
  const lang = await article.getAttribute("lang");
  expect(lang).toBe("en");
});
