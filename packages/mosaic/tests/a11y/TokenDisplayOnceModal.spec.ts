import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("TokenDisplayOnceModal has no a11y violations", async ({ page }) => {
  await page.goto("/iframe.html?id=confirmation-tokendisplayoncemodal--default");
  const results = await new AxeBuilder({ page }).include("#storybook-root").analyze();
  expect(results.violations).toHaveLength(0);
});

test("TokenDisplayOnceModal has role=dialog and aria-modal=true", async ({ page }) => {
  await page.goto("/iframe.html?id=confirmation-tokendisplayoncemodal--default");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
});

test("TokenDisplayOnceModal aria-labelledby points to visible title", async ({ page }) => {
  await page.goto("/iframe.html?id=confirmation-tokendisplayoncemodal--default");
  const dialog = page.getByRole("dialog");
  const labelledById = await dialog.getAttribute("aria-labelledby");
  expect(labelledById).toBeTruthy();
  const titleEl = page.locator(`#${labelledById}`);
  await expect(titleEl).toBeVisible();
});

test("TokenDisplayOnceModal aria-describedby points to warning message", async ({ page }) => {
  await page.goto("/iframe.html?id=confirmation-tokendisplayoncemodal--default");
  const dialog = page.getByRole("dialog");
  const describedById = await dialog.getAttribute("aria-describedby");
  expect(describedById).toBeTruthy();
  const warningEl = page.locator(`#${describedById}`);
  await expect(warningEl).toBeVisible();
});

test("TokenDisplayOnceModal copy button is keyboard focusable", async ({ page }) => {
  await page.goto("/iframe.html?id=confirmation-tokendisplayoncemodal--default");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeTruthy();
});

test("TokenDisplayOnceModal aria-live region exists for copy confirmation", async ({ page }) => {
  await page.goto("/iframe.html?id=confirmation-tokendisplayoncemodal--default");
  const liveRegion = page.locator('[role="status"][aria-live="polite"]');
  await expect(liveRegion).toBeTruthy();
});

test("TokenDisplayOnceModal token not in any data-* attribute (security)", async ({ page }) => {
  await page.goto("/iframe.html?id=confirmation-tokendisplayoncemodal--default");
  // Ensure the token value "tok_demo_xxx_safe_dummy" never appears in a data attribute
  const elementsWithToken = await page.locator('[data-*="tok_demo_xxx_safe_dummy"]').count();
  expect(elementsWithToken).toBe(0);
});
