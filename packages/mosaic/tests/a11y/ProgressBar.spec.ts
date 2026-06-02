import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("ProgressBar has no a11y violations", async ({ page }) => {
  await page.goto("/storybook/?story=progress-bar--default");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});
