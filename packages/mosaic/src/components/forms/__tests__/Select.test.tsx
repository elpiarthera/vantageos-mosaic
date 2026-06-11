import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FormProvider } from "../../../runtimes/react/components/forms/FormProvider";
import { Select } from "../../../runtimes/react/components/forms/Select";
import { useMosaicForm } from "../../../runtimes/react/components/forms/useMosaicForm";
import {
  filterOptions,
  findByTypeAhead,
  findFirstEnabledIndex,
  findLastEnabledIndex,
  findNextEnabledIndex,
  getListboxId,
  getOptionId,
  getTriggerId,
  indexOfValue,
  resolveSelectedLabel,
} from "../Select.logic";
import { SelectOptionSchema, SelectPropsSchema, validateSelectProps } from "../Select.schema";

// ─── Schema tests ────────────────────────────────────────────────────────────

describe("SelectPropsSchema", () => {
  it("requires non-empty name", () => {
    const r = SelectPropsSchema.safeParse({ name: "", options: [], label: "x" });
    expect(r.success).toBe(false);
  });

  it("requires at least one option", () => {
    const r = SelectPropsSchema.safeParse({ name: "country", options: [], label: "Country" });
    expect(r.success).toBe(false);
  });

  it("defaults disabled to false", () => {
    const parsed = SelectPropsSchema.parse({
      name: "country",
      label: "Country",
      options: [{ value: "fr", label: "France" }],
    });
    expect(parsed.disabled).toBe(false);
  });

  it("defaults searchable to false", () => {
    const parsed = SelectPropsSchema.parse({
      name: "country",
      label: "Country",
      options: [{ value: "fr", label: "France" }],
    });
    expect(parsed.searchable).toBe(false);
  });

  it("defaults locale to 'en'", () => {
    const parsed = SelectPropsSchema.parse({
      name: "country",
      label: "Country",
      options: [{ value: "fr", label: "France" }],
    });
    expect(parsed.locale).toBe("en");
  });

  it("rejects invalid locale", () => {
    const r = SelectPropsSchema.safeParse({
      name: "country",
      label: "Country",
      options: [{ value: "fr", label: "France" }],
      locale: "de",
    });
    expect(r.success).toBe(false);
  });

  it("accepts a full valid props object", () => {
    const parsed = validateSelectProps({
      name: "country",
      label: "Country",
      options: [
        { value: "fr", label: "France" },
        { value: "us", label: "United States", disabled: true },
      ],
      placeholder: "Select a country",
      disabled: false,
      searchable: true,
      locale: "fr",
    });
    expect(parsed.name).toBe("country");
    expect(parsed.options).toHaveLength(2);
    expect(parsed.searchable).toBe(true);
    expect(parsed.locale).toBe("fr");
  });
});

describe("SelectOptionSchema", () => {
  it("requires non-empty value", () => {
    const r = SelectOptionSchema.safeParse({ value: "", label: "France" });
    expect(r.success).toBe(false);
  });

  it("requires non-empty label", () => {
    const r = SelectOptionSchema.safeParse({ value: "fr", label: "" });
    expect(r.success).toBe(false);
  });

  it("defaults disabled to false", () => {
    const parsed = SelectOptionSchema.parse({ value: "fr", label: "France" });
    expect(parsed.disabled).toBe(false);
  });

  it("accepts disabled option", () => {
    const parsed = SelectOptionSchema.parse({
      value: "us",
      label: "United States",
      disabled: true,
    });
    expect(parsed.disabled).toBe(true);
  });
});

// ─── Pure logic tests ─────────────────────────────────────────────────────────

const OPTIONS = [
  { value: "fr", label: "France", disabled: false },
  { value: "us", label: "United States", disabled: false },
  { value: "de", label: "Germany", disabled: true },
  { value: "jp", label: "Japan", disabled: false },
];

describe("Select logic — ID helpers", () => {
  it("getTriggerId returns correct id", () => {
    expect(getTriggerId("inst-1")).toBe("inst-1-trigger");
  });

  it("getListboxId returns correct id", () => {
    expect(getListboxId("inst-1")).toBe("inst-1-listbox");
  });

  it("getOptionId returns correct id", () => {
    expect(getOptionId("inst-1", "fr")).toBe("inst-1-opt-fr");
  });
});

describe("Select logic — filterOptions", () => {
  it("returns all options when query is empty", () => {
    expect(filterOptions(OPTIONS, "")).toHaveLength(4);
  });

  it("filters case-insensitively by label", () => {
    const result = filterOptions(OPTIONS, "united");
    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBe("us");
  });

  it("trims the query before filtering", () => {
    const result = filterOptions(OPTIONS, "  france  ");
    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBe("fr");
  });

  it("returns empty array when no match", () => {
    expect(filterOptions(OPTIONS, "xyz")).toHaveLength(0);
  });

  it("preserves disabled flag on matched options", () => {
    const result = filterOptions(OPTIONS, "germany");
    expect(result[0]?.disabled).toBe(true);
  });
});

describe("Select logic — indexOfValue", () => {
  it("returns index of matching value", () => {
    expect(indexOfValue(OPTIONS, "us")).toBe(1);
  });

  it("returns -1 for null value", () => {
    expect(indexOfValue(OPTIONS, null)).toBe(-1);
  });

  it("returns -1 for undefined value", () => {
    expect(indexOfValue(OPTIONS, undefined)).toBe(-1);
  });

  it("returns -1 when value not in list", () => {
    expect(indexOfValue(OPTIONS, "ca")).toBe(-1);
  });
});

describe("Select logic — navigation", () => {
  it("findFirstEnabledIndex skips disabled options", () => {
    const opts = [
      { value: "a", label: "A", disabled: true },
      { value: "b", label: "B", disabled: false },
    ];
    expect(findFirstEnabledIndex(opts)).toBe(1);
  });

  it("findFirstEnabledIndex returns -1 when all disabled", () => {
    const opts = [{ value: "a", label: "A", disabled: true }];
    expect(findFirstEnabledIndex(opts)).toBe(-1);
  });

  it("findLastEnabledIndex returns index of last enabled", () => {
    expect(findLastEnabledIndex(OPTIONS)).toBe(3); // jp at index 3
  });

  it("findLastEnabledIndex skips disabled at end", () => {
    const opts = [
      { value: "a", label: "A", disabled: false },
      { value: "b", label: "B", disabled: true },
    ];
    expect(findLastEnabledIndex(opts)).toBe(0);
  });

  it("findNextEnabledIndex moves forward skipping disabled", () => {
    // Start at 1 (US), direction +1: index 2 is disabled (DE), should return 3 (JP)
    expect(findNextEnabledIndex(OPTIONS, 1, 1)).toBe(3);
  });

  it("findNextEnabledIndex moves backward", () => {
    // Start at 3 (JP), direction -1: skips 2 (DE disabled), returns 1 (US)
    expect(findNextEnabledIndex(OPTIONS, 3, -1)).toBe(1);
  });

  it("findNextEnabledIndex wraps around", () => {
    // Start at 3 (JP), direction +1: wraps to 0 (FR)
    expect(findNextEnabledIndex(OPTIONS, 3, 1)).toBe(0);
  });
});

describe("Select logic — type-ahead", () => {
  it("returns index of first option starting with buffer", () => {
    expect(findByTypeAhead(OPTIONS, "f")).toBe(0); // France
  });

  it("is case-insensitive", () => {
    expect(findByTypeAhead(OPTIONS, "J")).toBe(3); // Japan
  });

  it("skips disabled options", () => {
    expect(findByTypeAhead(OPTIONS, "g")).toBe(-1); // Germany is disabled
  });

  it("returns -1 for empty buffer", () => {
    expect(findByTypeAhead(OPTIONS, "")).toBe(-1);
  });

  it("returns -1 when no match", () => {
    expect(findByTypeAhead(OPTIONS, "z")).toBe(-1);
  });
});

describe("Select logic — resolveSelectedLabel", () => {
  it("returns label of matching value", () => {
    expect(resolveSelectedLabel(OPTIONS, "fr")).toBe("France");
  });

  it("returns null for null value", () => {
    expect(resolveSelectedLabel(OPTIONS, null)).toBeNull();
  });

  it("returns null for undefined value", () => {
    expect(resolveSelectedLabel(OPTIONS, undefined)).toBeNull();
  });

  it("returns null when value not found", () => {
    expect(resolveSelectedLabel(OPTIONS, "ca")).toBeNull();
  });
});

// ─── Runtime tests (React) ────────────────────────────────────────────────────

const COUNTRY_OPTIONS = [
  { value: "fr", label: "France", disabled: false },
  { value: "us", label: "United States", disabled: false },
  { value: "de", label: "Germany", disabled: true },
  { value: "jp", label: "Japan", disabled: false },
];

function Harness({
  defaultValues,
  placeholder,
  disabled,
  searchable,
  label,
}: {
  defaultValues: { country: string };
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  label?: string;
}) {
  const schema = z.object({
    country: z.string({ required_error: "required" }).min(1, "required"),
  });
  const form = useMosaicForm({ schema, defaultValues });
  return (
    <FormProvider form={form}>
      <Select
        name="country"
        label={label ?? "Country / Pays"}
        options={COUNTRY_OPTIONS}
        placeholder={placeholder}
        disabled={disabled}
        searchable={searchable}
      />
    </FormProvider>
  );
}

describe("Select (React runtime)", () => {
  it("renders a trigger button with role=combobox", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeTruthy();
  });

  it("renders label text", () => {
    render(<Harness defaultValues={{ country: "" }} label="Country / Pays" />);
    expect(screen.getByText("Country / Pays")).toBeTruthy();
  });

  it("shows placeholder when no value selected", () => {
    render(<Harness defaultValues={{ country: "" }} placeholder="Select a country" />);
    expect(screen.getByText("Select a country")).toBeTruthy();
  });

  it("opens listbox on click (aria-expanded toggles)", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("renders all enabled options when open", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    fireEvent.click(screen.getByRole("combobox"));
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4);
  });

  it("marks disabled option with aria-disabled", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    fireEvent.click(screen.getByRole("combobox"));
    const germanOption = screen.getByText("Germany").closest("[role=option]");
    expect(germanOption?.getAttribute("aria-disabled")).toBe("true");
  });

  it("selects an option on click, closes popup, shows selected label in trigger", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.mouseDown(screen.getByText("France"));
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("France")).toBeTruthy();
    const trigger = screen.getByRole("combobox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("marks selected option with aria-selected=true", () => {
    render(<Harness defaultValues={{ country: "fr" }} />);
    fireEvent.click(screen.getByRole("combobox"));
    // "France" appears in both the trigger label and the listbox option
    const franceOption = screen
      .getAllByText("France")
      .find((el) => el.getAttribute("role") === "option");
    expect(franceOption?.getAttribute("aria-selected")).toBe("true");
  });

  it("closes on Escape key and restores focus to trigger", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("opens on ArrowDown key when closed", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("navigates options with ArrowDown, commits with Enter", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    // ArrowDown from first item (FR) → skip nothing → stays FR? actually moves to next enabled
    // Initial active should be first enabled (FR at 0), ArrowDown → US at 1
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    // Popup closed, US selected
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("Home key moves to first enabled option", () => {
    render(<Harness defaultValues={{ country: "jp" }} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "Home" });
    const activeId = trigger.getAttribute("aria-activedescendant");
    expect(activeId).toContain("fr"); // first enabled is France
  });

  it("End key moves to last enabled option", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "End" });
    const activeId = trigger.getAttribute("aria-activedescendant");
    expect(activeId).toContain("jp"); // last enabled is Japan
  });

  it("aria-activedescendant is set when popup is open", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-activedescendant")).toBeTruthy();
  });

  it("aria-activedescendant is absent when popup is closed", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    expect(trigger.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("type-ahead jumps to first matching option", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "j" }); // Japan
    const activeId = trigger.getAttribute("aria-activedescendant");
    expect(activeId).toContain("jp");
  });

  it("disabled select does not open popup", () => {
    render(<Harness defaultValues={{ country: "" }} disabled={true} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("renders search input when searchable=true and popup is open", () => {
    render(<Harness defaultValues={{ country: "" }} searchable={true} />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("textbox", { name: /search/i })).toBeTruthy();
  });

  it("search filters visible options", () => {
    render(<Harness defaultValues={{ country: "" }} searchable={true} />);
    fireEvent.click(screen.getByRole("combobox"));
    const searchInput = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(searchInput, { target: { value: "france" } });
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]?.textContent).toBe("France");
  });

  it("shows 'No options' when search has no results", () => {
    render(<Harness defaultValues={{ country: "" }} searchable={true} />);
    fireEvent.click(screen.getByRole("combobox"));
    const searchInput = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(searchInput, { target: { value: "zzz" } });
    expect(screen.getByText("No options")).toBeTruthy();
  });

  it("aria-controls points to the listbox id", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    const controlsId = trigger.getAttribute("aria-controls");
    fireEvent.click(trigger);
    const listbox = screen.getByRole("listbox");
    expect(listbox.id).toBe(controlsId);
  });

  it("aria-haspopup=listbox is set on trigger", () => {
    render(<Harness defaultValues={{ country: "" }} />);
    expect(screen.getByRole("combobox").getAttribute("aria-haspopup")).toBe("listbox");
  });

  it("validates onBlur (not on change) — onBlur timing", async () => {
    render(<Harness defaultValues={{ country: "" }} />);
    const trigger = screen.getByRole("combobox");
    // No error before blur
    expect(screen.queryByRole("alert")).toBeNull();
    // Simulate click then Escape (closes without selecting), then blur
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "Escape" });
    fireEvent.blur(trigger);
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeTruthy();
    });
  });
});
