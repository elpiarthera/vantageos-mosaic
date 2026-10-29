import axe from "axe-core";

/**
 * WCAG 2.x A + AA axe run on a rendered container (App standard A-4). `color-contrast` needs real
 * layout and computed colours, which jsdom does not have, so that one rule is not run here (the
 * Playwright axe gate on Storybook covers contrast); every other WCAG A/AA rule runs.
 */
export async function wcagViolations(container: Element): Promise<string[]> {
  const result = await axe.run(container as HTMLElement, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(" | ")}`);
}

/** Positive control: a known-bad fragment must produce at least one violation. */
export const BAD_FRAGMENT = '<img src="x.png"><button></button>';
