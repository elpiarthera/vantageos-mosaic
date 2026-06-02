import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("StatusBadge — default story has no a11y violations", async ({ page }) => {
  await page.goto("/storybook/?story=media-statusbadge--default");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});

test("StatusBadge — error story renders accessible alert", async ({ page }) => {
  await page.goto("/storybook/?story=media-statusbadge--error");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});

test("StatusBadge — empty story has no a11y violations", async ({ page }) => {
  await page.goto("/storybook/?story=media-statusbadge--empty");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});

test("StatusBadge — badge has status role and aria-label", async ({ page }) => {
  await page.goto("/storybook/?story=media-statusbadge--default");
  const badge = page.getByRole("status");
  await expect(badge).toBeVisible();
  const ariaLabel = await badge.getAttribute("aria-label");
  expect(ariaLabel).toBe("active");
});
