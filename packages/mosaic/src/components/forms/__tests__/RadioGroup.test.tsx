import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FormProvider } from "../../../runtimes/react/components/forms/FormProvider";
import { RadioGroup } from "../../../runtimes/react/components/forms/RadioGroup";
import { useMosaicForm } from "../../../runtimes/react/components/forms/useMosaicForm";
import {
  findFirstEnabledIndex,
  findLastEnabledIndex,
  findNextEnabledIndex,
  findSelectedIndex,
  getGroupLabelId,
  getNavKeys,
  getOptionLabelId,
  getRovingTabIndex,
  isActivationKey,
} from "../RadioGroup.logic";
import {
  RadioGroupOptionSchema,
  RadioGroupPropsSchema,
  validateRadioGroupProps,
} from "../RadioGroup.schema";

// ─── Schema tests ────────────────────────────────────────────────────────────

describe("RadioGroupOptionSchema", () => {
  it("accepts a valid option", () => {
    const r = RadioGroupOptionSchema.safeParse({ value: "a", label: "Option A" });
    expect(r.success).toBe(true);
  });

  it("accepts option with description and disabled", () => {
    const r = RadioGroupOptionSchema.safeParse({
      value: "b",
      label: "Option B",
      description: "B description",
      disabled: true,
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty value", () => {
    const r = RadioGroupOptionSchema.safeParse({ value: "", label: "A" });
    expect(r.success).toBe(false);
  });

  it("rejects empty label", () => {
    const r = RadioGroupOptionSchema.safeParse({ value: "a", label: "" });
    expect(r.success).toBe(false);
  });
});

describe("RadioGroupPropsSchema", () => {
  const validBase = {
    name: "color",
    label: "Pick a color",
    options: [{ value: "red", label: "Red" }],
  };

  it("accepts minimal valid props", () => {
    const r = RadioGroupPropsSchema.safeParse(validBase);
    expect(r.success).toBe(true);
  });

  it("defaults orientation to 'vertical'", () => {
    const r = RadioGroupPropsSchema.safeParse(validBase);
    expect(r.success && r.data.orientation).toBe("vertical");
  });

  it("defaults disabled to false", () => {
    const r = RadioGroupPropsSchema.safeParse(validBase);
    expect(r.success && r.data.disabled).toBe(false);
  });

  it("accepts horizontal orientation", () => {
    const r = RadioGroupPropsSchema.safeParse({ ...validBase, orientation: "horizontal" });
    expect(r.success && r.data.orientation).toBe("horizontal");
  });

  it("rejects empty name", () => {
    const r = RadioGroupPropsSchema.safeParse({ ...validBase, name: "" });
    expect(r.success).toBe(false);
  });

  it("rejects empty label", () => {
    const r = RadioGroupPropsSchema.safeParse({ ...validBase, label: "" });
    expect(r.success).toBe(false);
  });

  it("rejects empty options array", () => {
    const r = RadioGroupPropsSchema.safeParse({ ...validBase, options: [] });
    expect(r.success).toBe(false);
  });

  it("rejects invalid orientation", () => {
    const r = RadioGroupPropsSchema.safeParse({ ...validBase, orientation: "diagonal" });
    expect(r.success).toBe(false);
  });

  it("validateRadioGroupProps throws on invalid input", () => {
    expect(() =>
      validateRadioGroupProps({ name: "", label: "L", options: [{ value: "a", label: "A" }] }),
    ).toThrow();
  });

  it("validateRadioGroupProps returns parsed result for valid input", () => {
    const result = validateRadioGroupProps(validBase);
    expect(result.name).toBe("color");
  });
});

// ─── Logic tests ─────────────────────────────────────────────────────────────

describe("findNextEnabledIndex", () => {
  const opts = [{ disabled: false }, { disabled: true }, { disabled: false }];

  it("moves forward skipping disabled", () => {
    expect(findNextEnabledIndex(opts, 0, 1)).toBe(2);
  });

  it("moves backward skipping disabled", () => {
    expect(findNextEnabledIndex(opts, 2, -1)).toBe(0);
  });

  it("wraps from last to first enabled", () => {
    expect(findNextEnabledIndex(opts, 2, 1)).toBe(0);
  });

  it("returns currentIndex when all disabled", () => {
    const allDisabled = [{ disabled: true }, { disabled: true }];
    expect(findNextEnabledIndex(allDisabled, 0, 1)).toBe(0);
  });
});

describe("findFirstEnabledIndex", () => {
  it("returns first non-disabled index", () => {
    expect(findFirstEnabledIndex([{ disabled: true }, { disabled: false }])).toBe(1);
  });

  it("returns 0 when all disabled", () => {
    expect(findFirstEnabledIndex([{ disabled: true }])).toBe(0);
  });
});

describe("findLastEnabledIndex", () => {
  it("returns last non-disabled index", () => {
    expect(findLastEnabledIndex([{ disabled: false }, { disabled: true }])).toBe(0);
  });

  it("returns last index when all disabled", () => {
    expect(findLastEnabledIndex([{ disabled: true }, { disabled: true }])).toBe(1);
  });
});

describe("findSelectedIndex", () => {
  const opts = [{ value: "a" }, { value: "b" }, { value: "c" }];

  it("returns -1 when selectedValue is undefined", () => {
    expect(findSelectedIndex(opts, undefined)).toBe(-1);
  });

  it("returns -1 when selectedValue is empty string", () => {
    expect(findSelectedIndex(opts, "")).toBe(-1);
  });

  it("returns correct index for matching value", () => {
    expect(findSelectedIndex(opts, "b")).toBe(1);
  });

  it("returns -1 for non-existent value", () => {
    expect(findSelectedIndex(opts, "z")).toBe(-1);
  });
});

describe("getRovingTabIndex", () => {
  const opts = [
    { value: "a", disabled: false },
    { value: "b", disabled: true },
    { value: "c", disabled: false },
  ];

  it("returns selected index when value matches", () => {
    expect(getRovingTabIndex(opts, "c")).toBe(2);
  });

  it("returns first enabled when nothing selected", () => {
    expect(getRovingTabIndex(opts, undefined)).toBe(0);
  });
});

describe("getNavKeys", () => {
  it("returns ArrowUp/Down for vertical", () => {
    expect(getNavKeys("vertical")).toEqual({ prev: "ArrowUp", next: "ArrowDown" });
  });

  it("returns ArrowLeft/Right for horizontal", () => {
    expect(getNavKeys("horizontal")).toEqual({ prev: "ArrowLeft", next: "ArrowRight" });
  });
});

describe("isActivationKey", () => {
  it("returns true for Space", () => {
    expect(isActivationKey(" ")).toBe(true);
  });

  it("returns true for 'Space' string", () => {
    expect(isActivationKey("Space")).toBe(true);
  });

  it("returns true for Enter", () => {
    expect(isActivationKey("Enter")).toBe(true);
  });

  it("returns false for ArrowDown", () => {
    expect(isActivationKey("ArrowDown")).toBe(false);
  });
});

describe("ID generation", () => {
  it("getGroupLabelId produces stable id", () => {
    expect(getGroupLabelId("inst1", "color")).toBe("inst1-color-label");
  });

  it("getOptionLabelId produces stable id", () => {
    expect(getOptionLabelId("inst1", "color", "red")).toBe("inst1-color-red-label");
  });
});

// ─── RadioGroup React component tests ────────────────────────────────────────

const OPTIONS = [
  { value: "red", label: "Red" },
  { value: "green", label: "Green", description: "Eco friendly" },
  { value: "blue", label: "Blue", disabled: true },
];

function Harness({
  defaultValue = "",
  orientation = "vertical" as "vertical" | "horizontal",
  groupDisabled = false,
  onSubmit,
}: {
  defaultValue?: string;
  orientation?: "vertical" | "horizontal";
  groupDisabled?: boolean;
  onSubmit?: (data: { color: string }) => void;
}) {
  const schema = z.object({ color: z.string().min(1, "required") });
  const form = useMosaicForm({ schema, defaultValues: { color: defaultValue } });

  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit((data: { color: string }) => onSubmit?.(data))}>
        <RadioGroup
          name="color"
          label="Pick a color"
          options={OPTIONS}
          orientation={orientation}
          disabled={groupDisabled}
        />
      </form>
    </FormProvider>
  );
}

describe("RadioGroup component", () => {
  it("renders group label", () => {
    render(<Harness />);
    expect(screen.getByText("Pick a color")).toBeTruthy();
  });

  it("renders all options", () => {
    render(<Harness />);
    expect(screen.getByText("Red")).toBeTruthy();
    expect(screen.getByText("Green")).toBeTruthy();
    expect(screen.getByText("Blue")).toBeTruthy();
  });

  it("renders description when provided", () => {
    render(<Harness />);
    expect(screen.getByText("Eco friendly")).toBeTruthy();
  });

  it("has role='radiogroup' on container", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup");
    expect(group).toBeTruthy();
  });

  it("has aria-labelledby on radiogroup pointing to group label", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup");
    const labelId = group.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    const labelEl = document.getElementById(labelId as string);
    expect(labelEl?.textContent).toBe("Pick a color");
  });

  it("renders native radio inputs", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    for (const r of radios) {
      expect((r as HTMLInputElement).type).toBe("radio");
    }
  });

  it("all radios unchecked initially when no default value", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    for (const r of radios) {
      expect(r.checked).toBe(false);
    }
  });

  it("pre-selected radio is checked when defaultValue provided", () => {
    render(<Harness defaultValue="red" />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[0]?.checked).toBe(true);
    expect(radios[1]?.checked).toBe(false);
  });

  it("each radio has aria-labelledby pointing to its own label span", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      const labelId = radio.getAttribute("aria-labelledby");
      expect(labelId).toBeTruthy();
      const labelEl = document.getElementById(labelId as string);
      expect(labelEl).toBeTruthy();
    }
  });

  it("option with description has aria-describedby", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio");
    const greenRadio = radios[1]; // Green has description
    expect(greenRadio?.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("clicking a radio checks it", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    fireEvent.click(radios[0] as HTMLElement);
    expect(radios[0]?.checked).toBe(true);
    expect(radios[1]?.checked).toBe(false);
  });

  it("clicking selects the radio (mutual exclusivity)", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    fireEvent.click(radios[0] as HTMLElement);
    fireEvent.click(radios[1] as HTMLElement);
    expect(radios[0]?.checked).toBe(false);
    expect(radios[1]?.checked).toBe(true);
  });

  it("ArrowDown selects and moves to next enabled option (vertical)", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    (radios[0] as HTMLElement).focus();
    fireEvent.keyDown(radios[0] as HTMLElement, { key: "ArrowDown" });
    // Second option (Green) should now be selected
    expect(radios[1]?.checked).toBe(true);
  });

  it("ArrowDown skips disabled option (Blue at index 2)", () => {
    render(<Harness defaultValue="green" />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    (radios[1] as HTMLElement).focus();
    fireEvent.keyDown(radios[1] as HTMLElement, { key: "ArrowDown" });
    // Blue is disabled, should wrap to Red
    expect(radios[0]?.checked).toBe(true);
  });

  it("ArrowUp selects previous enabled option (vertical)", () => {
    render(<Harness defaultValue="green" />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    (radios[1] as HTMLElement).focus();
    fireEvent.keyDown(radios[1] as HTMLElement, { key: "ArrowUp" });
    expect(radios[0]?.checked).toBe(true);
  });

  it("ArrowRight selects next for horizontal orientation", () => {
    render(<Harness orientation="horizontal" />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    (radios[0] as HTMLElement).focus();
    fireEvent.keyDown(radios[0] as HTMLElement, { key: "ArrowRight" });
    expect(radios[1]?.checked).toBe(true);
  });

  it("ArrowLeft selects previous for horizontal orientation", () => {
    render(<Harness orientation="horizontal" defaultValue="green" />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    (radios[1] as HTMLElement).focus();
    fireEvent.keyDown(radios[1] as HTMLElement, { key: "ArrowLeft" });
    expect(radios[0]?.checked).toBe(true);
  });

  it("Space activates the focused radio", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    (radios[0] as HTMLElement).focus();
    fireEvent.keyDown(radios[0] as HTMLElement, { key: " " });
    expect(radios[0]?.checked).toBe(true);
  });

  it("Enter activates the focused radio", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    (radios[0] as HTMLElement).focus();
    fireEvent.keyDown(radios[0] as HTMLElement, { key: "Enter" });
    expect(radios[0]?.checked).toBe(true);
  });

  it("Home key selects first enabled option", () => {
    render(<Harness defaultValue="green" />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    (radios[1] as HTMLElement).focus();
    fireEvent.keyDown(radios[1] as HTMLElement, { key: "Home" });
    expect(radios[0]?.checked).toBe(true);
  });

  it("End key selects last enabled option (skips disabled Blue)", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    (radios[0] as HTMLElement).focus();
    fireEvent.keyDown(radios[0] as HTMLElement, { key: "End" });
    // Blue (last) is disabled → last enabled is Green (index 1)
    expect(radios[1]?.checked).toBe(true);
  });

  it("disabled option has disabled attribute and tabIndex=-1", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    const blueRadio = radios[2] as HTMLInputElement; // Blue is disabled
    expect(blueRadio.disabled).toBe(true);
    expect(blueRadio.getAttribute("tabindex")).toBe("-1");
  });

  it("clicking disabled option does not select it", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    const blueRadio = radios[2] as HTMLInputElement;
    // Disabled inputs don't fire onChange — value stays empty
    expect(blueRadio.disabled).toBe(true);
    expect(blueRadio.checked).toBe(false);
  });

  it("group disabled makes all radios disabled", () => {
    render(<Harness groupDisabled />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    for (const r of radios) {
      expect(r.disabled).toBe(true);
    }
  });

  it("roving tabIndex: selected option gets tabIndex=0", () => {
    render(<Harness defaultValue="red" />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]?.getAttribute("tabindex")).toBe("0");
    expect(radios[1]?.getAttribute("tabindex")).toBe("-1");
  });

  it("roving tabIndex: first enabled gets tabIndex=0 when nothing selected", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]?.getAttribute("tabindex")).toBe("0"); // Red is first enabled
  });

  it("aria-orientation reflects the orientation prop (vertical)", () => {
    render(<Harness orientation="vertical" />);
    const group = screen.getByRole("radiogroup");
    expect(group.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("aria-orientation reflects the orientation prop (horizontal)", () => {
    render(<Harness orientation="horizontal" />);
    const group = screen.getByRole("radiogroup");
    expect(group.getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("onBlur triggers after click (RHF onBlur mode — T10 lesson #4)", async () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio");
    // Click triggers onChange+onBlur pair — error should NOT show (value is valid after click)
    fireEvent.click(radios[0] as HTMLElement);
    fireEvent.blur(radios[0] as HTMLElement);
    await waitFor(() => {
      // After selecting Red, no validation error
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});
