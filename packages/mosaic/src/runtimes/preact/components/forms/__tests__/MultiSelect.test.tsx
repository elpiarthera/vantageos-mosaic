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
});
