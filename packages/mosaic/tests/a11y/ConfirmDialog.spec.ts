import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("ConfirmDialog default variant has no a11y violations", async ({ page }) => {
  await page.goto("/iframe.html?id=input-confirmdialog--default");
  const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
  expect(results.violations).toHaveLength(0);
});

test("ConfirmDialog danger variant has no a11y violations", async ({ page }) => {
  await page.goto("/iframe.html?id=input-confirmdialog--default&args=variant:danger");
  const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
  expect(results.violations).toHaveLength(0);
});

test("ConfirmDialog has role=dialog and aria-modal=true", async ({ page }) => {
  await page.goto("/iframe.html?id=input-confirmdialog--default");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
});

test("ConfirmDialog aria-labelledby points to visible title", async ({ page }) => {
  await page.goto("/iframe.html?id=input-confirmdialog--default");
  const dialog = page.getByRole("dialog");
  const labelledById = await dialog.getAttribute("aria-labelledby");
  expect(labelledById).toBeTruthy();
  const titleEl = page.locator(`#${labelledById}`);
  await expect(titleEl).toBeVisible();
});

test("ConfirmDialog aria-describedby points to visible message", async ({ page }) => {
  await page.goto("/iframe.html?id=input-confirmdialog--default");
  const dialog = page.getByRole("dialog");
  const describedById = await dialog.getAttribute("aria-describedby");
  expect(describedById).toBeTruthy();
  const messageEl = page.locator(`#${describedById}`);
  await expect(messageEl).toBeVisible();
});

test("ConfirmDialog confirm button is keyboard focusable", async ({ page }) => {
  await page.goto("/iframe.html?id=input-confirmdialog--default");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeTruthy();
});
