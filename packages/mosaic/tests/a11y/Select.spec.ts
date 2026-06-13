import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The Select component implements the WAI-ARIA APG combobox + listbox pattern:
// a <button role="combobox"> trigger that controls a <ul role="listbox"> of
// <li role="option"> items, with active-option tracking via aria-activedescendant.
// These tests prove the pattern is genuinely accessible (axe-core 0 violations),
// which is the justification behind the biome-ignore comments on the ARIA roles
// in src/runtimes/{react,preact}/components/forms/Select.tsx.
//
// axe is scoped to the rendered story root (#storybook-root) so the storybook
// iframe shell's page-level best-practice rules (landmark-one-main,
// page-has-heading-one, region) do not mask the component-level result.
const ROOT = "#storybook-root";

test("Select (closed) has no a11y violations", async ({ page }) => {
  await page.goto("/iframe.html?id=forms-select--default");
  const results = await new AxeBuilder({ page }).include(ROOT).analyze();
  expect(results.violations).toHaveLength(0);
});

test("Select (open listbox + options) has no a11y violations", async ({ page }) => {
  await page.goto("/iframe.html?id=forms-select--default");
  await page.getByRole("combobox").click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option").first()).toBeVisible();
  const results = await new AxeBuilder({ page }).include(ROOT).analyze();
  expect(results.violations).toHaveLength(0);
});

test("Select searchable variant has no a11y violations", async ({ page }) => {
  await page.goto("/iframe.html?id=forms-select--searchable");
  await page.getByRole("combobox").click();
  await expect(page.getByRole("listbox")).toBeVisible();
  const results = await new AxeBuilder({ page }).include(ROOT).analyze();
  expect(results.violations).toHaveLength(0);
});

test("Select trigger exposes role=combobox with APG wiring", async ({ page }) => {
  await page.goto("/iframe.html?id=forms-select--default");
  const trigger = page.getByRole("combobox");
  await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  const controls = await trigger.getAttribute("aria-controls");
  expect(controls).toBeTruthy();
});

test("Select active option is tracked via aria-activedescendant", async ({ page }) => {
  await page.goto("/iframe.html?id=forms-select--default");
  const trigger = page.getByRole("combobox");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("ArrowDown");
  const activeId = await trigger.getAttribute("aria-activedescendant");
  expect(activeId).toBeTruthy();
  const activeOption = page.locator(`#${activeId}`);
  await expect(activeOption).toHaveAttribute("role", "option");
});
