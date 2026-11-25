import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import * as z from "zod";
import {
  addValue,
  filterBySearch,
  getAvailableOptions,
  getSelectedOptions,
  isAtMaxItems,
  removeValue,
} from "../../../../../components/forms/MultiSelect.logic";
import { FormProvider } from "../FormProvider";
import { MultiSelect } from "../MultiSelect";
import { useMosaicForm } from "../useMosaicForm";

afterEach(cleanup);

const PARITY_OPTS = [
  { value: "fr", label: "France" },
  { value: "es", label: "Spain" },
];

const THREE_OPTS = [...PARITY_OPTS, { value: "de", label: "Germany" }];

function ThreeHarness() {
  const form = useMosaicForm({
    schema: z.object({ countries: z.array(z.string()) }),
    defaultValues: { countries: [] as string[] },
  });
  return (
    <FormProvider form={form}>
      <MultiSelect name="countries" label="Countries" options={THREE_OPTS} />
    </FormProvider>
  );
}

/** Every aria-activedescendant on a combobox must name an element present in the document. */
function expectActiveDescendantResolves(trigger: HTMLElement) {
  const id = trigger.getAttribute("aria-activedescendant");
  if (id !== null) expect(document.getElementById(id)).not.toBeNull();
}

function Harness() {
  const form = useMosaicForm({
    schema: z.object({ countries: z.array(z.string()) }),
    defaultValues: { countries: [] as string[] },
  });
  return (
    <FormProvider form={form}>
      <MultiSelect name="countries" label="Countries" options={PARITY_OPTS} />
    </FormProvider>
  );
}

/**
 * Preact parity smoke. The JSX runs via React testing library in vitest because
 * the `preact/compat` alias is applied at tsup build time only (Standard §18.2).
 * The shared logic file is the parity contract — we verify both runtimes share
 * the same `MultiSelect.logic` reference and that the Preact component is
 * exported with the same name.
 */
describe("preact/forms MultiSelect parity", () => {
  it("exports MultiSelect", () => {
    expect(typeof MultiSelect).toBe("function");
  });

  it("shares the same logic helpers as the React runtime", () => {
    const OPTS = [
      { value: "fr", label: "France" },
      { value: "es", label: "Spain" },
    ];
    expect(getAvailableOptions(OPTS, ["fr"]).map((o) => o.value)).toEqual(["es"]);
    expect(getSelectedOptions(OPTS, ["es"]).map((o) => o.label)).toEqual(["Spain"]);
    expect(filterBySearch(OPTS, "fra").map((o) => o.value)).toEqual(["fr"]);
    expect(addValue(["fr"], "es")).toEqual(["fr", "es"]);
    expect(addValue(["fr"], "fr")).toEqual(["fr"]);
    expect(removeValue(["fr", "es"], "fr")).toEqual(["es"]);
    expect(isAtMaxItems(["fr", "es"], 2)).toBe(true);
  });
});

describe("preact/forms MultiSelect combobox keyboard + ARIA parity", () => {
  it("aria-multiselectable sits on the listbox, not the combobox", () => {
    render(<Harness />);
    const trigger = screen.getByTestId("multiselect-trigger");
    expect(trigger.hasAttribute("aria-multiselectable")).toBe(false);
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox").getAttribute("aria-multiselectable")).toBe("true");
  });

  it("keyboard on the focused combobox alone selects an option via aria-activedescendant", async () => {
    render(<Harness />);
    const trigger = screen.getByTestId("multiselect-trigger");
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const spain = screen.getByTestId("option-es");
    expect(spain.id).not.toBe("");
    expect(trigger.getAttribute("aria-activedescendant")).toBe(spain.id);
    fireEvent.keyDown(trigger, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByTestId("multiselect-chips").textContent).toContain("Spain");
    });
    expect(document.activeElement).toBe(trigger);
  });

  it("a keyboard selection that shrinks the list clamps the active option (parity)", async () => {
    render(<ThreeHarness />);
    const trigger = screen.getByTestId("multiselect-trigger");
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(trigger.getAttribute("aria-activedescendant")).toBe(screen.getByTestId("option-de").id);
    // Select the LAST option: the list shrinks to two and the old index 2 is past its end.
    fireEvent.keyDown(trigger, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByTestId("multiselect-chips").textContent).toContain("Germany");
    });
    expect(screen.queryByTestId("option-de")).toBeNull();
    expectActiveDescendantResolves(trigger);
    // The active option is clamped to the new last option (Spain), so Enter selects it.
    expect(trigger.getAttribute("aria-activedescendant")).toBe(screen.getByTestId("option-es").id);
    fireEvent.keyDown(trigger, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByTestId("multiselect-chips").textContent).toContain("Spain");
    });
    expectActiveDescendantResolves(trigger);
    // One option left: it is active, and Enter selects it.
    expect(trigger.getAttribute("aria-activedescendant")).toBe(screen.getByTestId("option-fr").id);
    fireEvent.keyDown(trigger, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByTestId("multiselect-chips").textContent).toContain("France");
    });
    // No option left: nothing is referenced.
    expect(trigger.hasAttribute("aria-activedescendant")).toBe(false);
  });
});
