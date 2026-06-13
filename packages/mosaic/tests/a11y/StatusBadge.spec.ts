import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("StatusBadge — default story has no a11y violations", async ({ page }) => {
  await page.goto("/iframe.html?id=media-statusbadge--default");
  const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
  expect(results.violations).toHaveLength(0);
});

test("StatusBadge — error story renders accessible alert", async ({ page }) => {
  await page.goto("/iframe.html?id=media-statusbadge--error-state");
  const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
  expect(results.violations).toHaveLength(0);
});

test("StatusBadge — empty story has no a11y violations", async ({ page }) => {
  await page.goto("/iframe.html?id=media-statusbadge--empty");
  const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
  expect(results.violations).toHaveLength(0);
});

test("StatusBadge — badge has status role and aria-label", async ({ page }) => {
  await page.goto("/iframe.html?id=media-statusbadge--default");
  const badge = page.getByRole("status");
  await expect(badge).toBeVisible();
  const ariaLabel = await badge.getAttribute("aria-label");
  expect(ariaLabel).toBe("active");
});
