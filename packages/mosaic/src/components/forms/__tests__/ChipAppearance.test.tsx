import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { FormProvider } from "../../../runtimes/react/components/forms/FormProvider";
import { MultiSelect } from "../../../runtimes/react/components/forms/MultiSelect";
import { RadioGroup } from "../../../runtimes/react/components/forms/RadioGroup";
import { useMosaicForm } from "../../../runtimes/react/components/forms/useMosaicForm";
import { MultiSelectPropsSchema } from "../MultiSelect.schema";
import { getGroupClasses, getOptionRowClasses } from "../RadioGroup.logic";
import { RadioGroupPropsSchema } from "../RadioGroup.schema";

afterEach(cleanup);

// R25: Claude design guidelines — "Prefer controls with visible options, such as segmented
// buttons, toggle chips, and inline tabs, over menus and dropdowns" (menus clip in the iframe).
const STAGES = [
  { value: "lead", label: "Lead" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

function RadioHarness({
  appearance,
}: { appearance?: "default" | "segmented" | "chips" }) {
  const form = useMosaicForm({
    schema: z.object({ stage: z.string() }),
    defaultValues: { stage: "won" },
  });
  return (
    <FormProvider form={form}>
      <RadioGroup name="stage" label="Stage" options={STAGES} appearance={appearance} />
    </FormProvider>
  );
}

function ChipsHarness({
  appearance,
  maxItems,
  onValue,
}: {
  appearance?: "default" | "chips";
  maxItems?: number;
  onValue?: (v: string[]) => void;
}) {
  const form = useMosaicForm({
    schema: z.object({ stages: z.array(z.string()) }),
    defaultValues: { stages: ["lead"] },
  });
  onValue?.(form.watch("stages") as string[]);
  return (
    <FormProvider form={form}>
      <MultiSelect
        name="stages"
        label="Stages"
        options={STAGES}
        appearance={appearance}
        maxItems={maxItems}
      />
    </FormProvider>
  );
}

describe("R25 RadioGroup appearance", () => {
  it("schema defaults appearance to default and accepts segmented | chips only", () => {
    const base = { name: "n", label: "l", options: [{ value: "a", label: "A" }] };
    expect(RadioGroupPropsSchema.parse(base).appearance).toBe("default");
    expect(RadioGroupPropsSchema.safeParse({ ...base, appearance: "chips" }).success).toBe(true);
    expect(RadioGroupPropsSchema.safeParse({ ...base, appearance: "pills" }).success).toBe(false);
  });

  it("logic maps appearance to distinct class sets (default unchanged)", () => {
    expect(getGroupClasses("horizontal", "default")).toBe("flex flex-row flex-wrap gap-4");
    expect(getGroupClasses("horizontal", "segmented")).not.toBe(getGroupClasses("horizontal"));
    expect(getGroupClasses("horizontal", "chips")).toContain("gap-2");
    expect(getOptionRowClasses(false, "vertical", "chips")).not.toBe(
      getOptionRowClasses(false, "vertical"),
    );
  });

  it("keeps radiogroup semantics and marks appearance and the selected option", () => {
    render(<RadioHarness appearance="segmented" />);
    const group = screen.queryAllByRole("radiogroup");
    expect(group).toHaveLength(1);
    expect(group[0]?.getAttribute("data-appearance")).toBe("segmented");
    expect(screen.queryAllByRole("radio")).toHaveLength(3);
    const selected = document.querySelectorAll('[data-selected="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0]?.textContent).toContain("Won");
  });

  it("renders no appearance marker by default", () => {
    render(<RadioHarness />);
    expect(screen.queryAllByRole("radiogroup")[0]?.getAttribute("data-appearance")).toBeNull();
  });
});

describe("R25 MultiSelect chips appearance", () => {
  it("schema defaults appearance to default", () => {
    const base = { name: "n", label: "l", options: [{ value: "a", label: "A" }] };
    expect(MultiSelectPropsSchema.parse(base).appearance).toBe("default");
    expect(MultiSelectPropsSchema.safeParse({ ...base, appearance: "chips" }).success).toBe(true);
    expect(MultiSelectPropsSchema.safeParse({ ...base, appearance: "menu" }).success).toBe(false);
  });

  it("shows every option as a visible toggle button, no dropdown", () => {
    render(<ChipsHarness appearance="chips" />);
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    const buttons = screen.queryAllByRole("button", { pressed: true }).concat(
      screen.queryAllByRole("button", { pressed: false }),
    );
    expect(buttons).toHaveLength(3);
    expect(screen.queryAllByRole("button", { name: "Lead", pressed: true })).toHaveLength(1);
    expect(screen.queryAllByRole("button", { name: "Won", pressed: false })).toHaveLength(1);
    expect(screen.queryAllByRole("group", { name: "Stages" })).toHaveLength(1);
  });

  it("toggles values into and out of the form value", () => {
    const seen: string[][] = [];
    render(<ChipsHarness appearance="chips" onValue={(v) => seen.push(v)} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Won" })[0] as HTMLElement);
    expect(seen.at(-1)).toEqual(["lead", "won"]);
    fireEvent.click(screen.getAllByRole("button", { name: "Lead" })[0] as HTMLElement);
    expect(seen.at(-1)).toEqual(["won"]);
  });

  it("disables unselected chips once maxItems is reached", () => {
    render(<ChipsHarness appearance="chips" maxItems={1} />);
    const won = screen.getAllByRole("button", { name: "Won" })[0] as HTMLButtonElement;
    expect(won.disabled).toBe(true);
    expect((screen.getAllByRole("button", { name: "Lead" })[0] as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it("leaves the default dropdown rendering untouched", () => {
    render(<ChipsHarness />);
    expect(screen.queryAllByRole("combobox").length).toBeGreaterThan(0);
  });
});
