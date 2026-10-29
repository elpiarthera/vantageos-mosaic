import { describe, expect, it } from "vitest";
import {
  findFirstEnabledIndex,
  findLastEnabledIndex,
  findNextEnabledIndex,
  resolveInitialActive,
} from "./Tabs.logic";

// The schema does not forbid every tab being disabled, so the logic carries a defined answer
// for that case; these tests pin it.
const allDisabled = [
  { id: "a", disabled: true },
  { id: "b", disabled: true },
];

describe("Tabs.logic — all-disabled and empty tab lists", () => {
  it("findNextEnabledIndex stays on the current index when every tab is disabled", () => {
    expect(findNextEnabledIndex(allDisabled, 1, 1)).toBe(1);
    expect(findNextEnabledIndex(allDisabled, 0, -1)).toBe(0);
  });

  it("findFirstEnabledIndex falls back to 0 when every tab is disabled", () => {
    expect(findFirstEnabledIndex(allDisabled)).toBe(0);
  });

  it("findLastEnabledIndex falls back to the last index when every tab is disabled", () => {
    expect(findLastEnabledIndex(allDisabled)).toBe(1);
  });

  it("resolveInitialActive ignores a disabled value/defaultValue and falls back to the first tab", () => {
    expect(resolveInitialActive(allDisabled, "b", "b")).toBe("a");
  });

  it("resolveInitialActive returns an empty id for an empty tab list", () => {
    expect(resolveInitialActive([])).toBe("");
  });
});
