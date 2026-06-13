import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("ProgressBar has no a11y violations", async ({ page }) => {
  await page.goto("/iframe.html?id=progress-progressbar--default");
  const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
  expect(results.violations).toHaveLength(0);
});
