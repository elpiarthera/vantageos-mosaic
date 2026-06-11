import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  FieldArray,
  useFieldArray,
} from "../../../runtimes/react/components/forms/FieldArray";
import { FormField } from "../../../runtimes/react/components/forms/FormField";
import { FormProvider } from "../../../runtimes/react/components/forms/FormProvider";
import { useMosaicForm } from "../../../runtimes/react/components/forms/useMosaicForm";
import {
  buildAddAriaLabel,
  buildListAriaLabel,
  buildRemoveAriaLabel,
  nextFocusIndexAfterRemove,
} from "../FieldArray.logic";
import {
  FieldArrayPropsSchema,
  UseFieldArrayOptionsSchema,
} from "../FieldArray.schema";

// ─── Schema tests ───────────────────────────────────────────────────────────

describe("FieldArrayPropsSchema", () => {
  it("requires non-empty name", () => {
    expect(FieldArrayPropsSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("accepts valid name", () => {
    expect(FieldArrayPropsSchema.safeParse({ name: "items" }).success).toBe(true);
  });
});

describe("UseFieldArrayOptionsSchema", () => {
  it("requires non-empty name", () => {
    expect(UseFieldArrayOptionsSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("accepts valid name", () => {
    expect(UseFieldArrayOptionsSchema.safeParse({ name: "vars" }).success).toBe(true);
  });
});

// ─── Pure logic tests ───────────────────────────────────────────────────────

describe("FieldArray.logic", () => {
  it("buildListAriaLabel", () => {
    expect(buildListAriaLabel("vars")).toBe("vars items");
  });

  it("buildRemoveAriaLabel uses 1-based index", () => {
    expect(buildRemoveAriaLabel("vars", 0)).toBe("Remove vars item 1");
    expect(buildRemoveAriaLabel("vars", 2)).toBe("Remove vars item 3");
  });

  it("buildAddAriaLabel", () => {
    expect(buildAddAriaLabel("vars")).toBe("Add vars item");
  });

  it("nextFocusIndexAfterRemove — empty list returns -1", () => {
    expect(nextFocusIndexAfterRemove(1, 0)).toBe(-1);
  });

  it("nextFocusIndexAfterRemove — middle item keeps index", () => {
    expect(nextFocusIndexAfterRemove(3, 1)).toBe(1);
  });

  it("nextFocusIndexAfterRemove — last item clamps to previous", () => {
    expect(nextFocusIndexAfterRemove(3, 2)).toBe(1);
  });
});

// ─── Harness: render-prop FieldArray + FormField ─────────────────────────────

type Vars = { vars: { value: string }[] };

function Harness({
  defaultValues,
}: {
  defaultValues?: Vars;
}) {
  const schema = z.object({
    vars: z.array(z.object({ value: z.string().min(1, "required") })),
  });
  const form = useMosaicForm<Vars>({
    schema,
    defaultValues: defaultValues ?? { vars: [{ value: "first" }] },
  });
  return (
    <FormProvider form={form}>
      <FieldArray<Vars, "vars"> name="vars">
        {({ field, index }, { append, remove, move, swap, fields }) => (
          <div data-testid={`row-${index}`} data-field-id={field.id}>
            <FormField name={`vars.${index}.value` as never}>
              {({ field: f }) => (
                <input
                  data-testid={`input-${index}`}
                  aria-label={`var ${index}`}
                  value={(f.value as string) ?? ""}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                />
              )}
            </FormField>
            <button
              type="button"
              aria-label={`Remove vars item ${index + 1}`}
              data-testid={`remove-${index}`}
              onClick={() => remove(index)}
            >
              x
            </button>
            <button
              type="button"
              data-testid={`up-${index}`}
              onClick={() => index > 0 && move(index, index - 1)}
            >
              up
            </button>
            <button
              type="button"
              data-testid={`swap-${index}`}
              onClick={() => index + 1 < fields.length && swap(index, index + 1)}
            >
              swap
            </button>
            <button
              type="button"
              data-testid={`append-${index}`}
              onClick={() =>
                // biome-ignore lint/suspicious/noExplicitAny: erased generic in test harness
                append({ value: `appended-${fields.length}` } as any)
              }
            >
              append
            </button>
          </div>
        )}
      </FieldArray>
    </FormProvider>
  );
}

// ─── Component tests ────────────────────────────────────────────────────────

describe("FieldArray render-prop", () => {
  it("renders one row per default entry", () => {
    render(
      <Harness
        defaultValues={{ vars: [{ value: "a" }, { value: "b" }, { value: "c" }] }}
      />,
    );
    expect(screen.getByTestId("row-0")).toBeTruthy();
    expect(screen.getByTestId("row-1")).toBeTruthy();
    expect(screen.getByTestId("row-2")).toBeTruthy();
    expect(screen.queryByTestId("row-3")).toBeNull();
  });

  it("emits role=list on container with default aria-label", () => {
    render(<Harness defaultValues={{ vars: [{ value: "x" }] }} />);
    const list = screen.getByRole("list");
    expect(list.getAttribute("aria-label")).toBe("vars items");
  });

  it("emits role=listitem per row", () => {
    render(
      <Harness defaultValues={{ vars: [{ value: "a" }, { value: "b" }] }} />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("append adds a row", async () => {
    render(<Harness defaultValues={{ vars: [{ value: "x" }] }} />);
    fireEvent.click(screen.getByTestId("append-0"));
    await waitFor(() => {
      expect(screen.getByTestId("row-1")).toBeTruthy();
    });
  });

  it("remove deletes a row", async () => {
    render(<Harness defaultValues={{ vars: [{ value: "a" }, { value: "b" }] }} />);
    fireEvent.click(screen.getByTestId("remove-0"));
    await waitFor(() => {
      expect(screen.queryByTestId("row-1")).toBeNull();
      expect(screen.getByTestId("row-0")).toBeTruthy();
    });
  });

  it("move reorders rows", async () => {
    render(
      <Harness defaultValues={{ vars: [{ value: "a" }, { value: "b" }] }} />,
    );
    const idBeforeRow0 = screen
      .getByTestId("row-0")
      .getAttribute("data-field-id");
    const idBeforeRow1 = screen
      .getByTestId("row-1")
      .getAttribute("data-field-id");
    fireEvent.click(screen.getByTestId("up-1"));
    await waitFor(() => {
      expect(screen.getByTestId("row-0").getAttribute("data-field-id")).toBe(
        idBeforeRow1,
      );
      expect(screen.getByTestId("row-1").getAttribute("data-field-id")).toBe(
        idBeforeRow0,
      );
    });
  });

  it("swap exchanges two rows", async () => {
    render(
      <Harness defaultValues={{ vars: [{ value: "a" }, { value: "b" }] }} />,
    );
    const idBeforeRow0 = screen
      .getByTestId("row-0")
      .getAttribute("data-field-id");
    fireEvent.click(screen.getByTestId("swap-0"));
    await waitFor(() => {
      expect(screen.getByTestId("row-1").getAttribute("data-field-id")).toBe(
        idBeforeRow0,
      );
    });
  });

  it("key stability — uses RHF field.id (not index) → ids stable after move", async () => {
    render(
      <Harness defaultValues={{ vars: [{ value: "a" }, { value: "b" }] }} />,
    );
    const idA = screen.getByTestId("row-0").getAttribute("data-field-id");
    const idB = screen.getByTestId("row-1").getAttribute("data-field-id");
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idA).not.toBe(idB);
    fireEvent.click(screen.getByTestId("up-1"));
    await waitFor(() => {
      // The PHYSICAL DOM nodes preserve their field.id even after reorder
      const seenIds = new Set(
        screen
          .getAllByRole("listitem")
          .map((el) => el.querySelector("[data-field-id]")?.getAttribute("data-field-id")),
      );
      expect(seenIds.has(idA)).toBe(true);
      expect(seenIds.has(idB)).toBe(true);
    });
  });

  it("remove button has aria-label per a11y convention", () => {
    render(<Harness defaultValues={{ vars: [{ value: "a" }] }} />);
    expect(screen.getByLabelText("Remove vars item 1")).toBeTruthy();
  });

  it("renders correct input value bound to RHF state", () => {
    render(
      <Harness defaultValues={{ vars: [{ value: "alpha" }, { value: "beta" }] }} />,
    );
    expect((screen.getByTestId("input-0") as HTMLInputElement).value).toBe("alpha");
    expect((screen.getByTestId("input-1") as HTMLInputElement).value).toBe("beta");
  });
});

// ─── useFieldArray hook tests (standalone, outside FieldArray component) ────

describe("useFieldArray hook", () => {
  function HookHarness() {
    const schema = z.object({
      vars: z.array(z.object({ value: z.string() })),
    });
    const form = useMosaicForm<Vars>({
      schema,
      defaultValues: { vars: [{ value: "seed" }] },
    });
    return (
      <FormProvider form={form}>
        <HookBody />
      </FormProvider>
    );
  }
  function HookBody() {
    const { fields, append, remove, move, swap } = useFieldArray<Vars, "vars">({
      name: "vars",
    });
    return (
      <div>
        <span data-testid="hook-len">{fields.length}</span>
        <button
          type="button"
          data-testid="hook-append"
          // biome-ignore lint/suspicious/noExplicitAny: erased generic in test harness
          onClick={() => append({ value: "more" } as any)}
        >
          append
        </button>
        <button type="button" data-testid="hook-remove" onClick={() => remove(0)}>
          remove
        </button>
        <button
          type="button"
          data-testid="hook-move"
          onClick={() => fields.length > 1 && move(0, 1)}
        >
          move
        </button>
        <button
          type="button"
          data-testid="hook-swap"
          onClick={() => fields.length > 1 && swap(0, 1)}
        >
          swap
        </button>
        <ul>
          {fields.map((f, i) => (
            <li key={f.id} data-testid={`hook-item-${i}`}>
              {f.id}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  it("returns fields + append + remove + move + swap as callable functions", async () => {
    render(<HookHarness />);
    expect(screen.getByTestId("hook-len").textContent).toBe("1");
    // append
    fireEvent.click(screen.getByTestId("hook-append"));
    await waitFor(() =>
      expect(screen.getByTestId("hook-len").textContent).toBe("2"),
    );
    // move
    const idBefore0 = screen.getByTestId("hook-item-0").textContent;
    fireEvent.click(screen.getByTestId("hook-move"));
    await waitFor(() =>
      expect(screen.getByTestId("hook-item-1").textContent).toBe(idBefore0),
    );
    // swap back
    fireEvent.click(screen.getByTestId("hook-swap"));
    await waitFor(() =>
      expect(screen.getByTestId("hook-item-0").textContent).toBe(idBefore0),
    );
    // remove
    fireEvent.click(screen.getByTestId("hook-remove"));
    await waitFor(() =>
      expect(screen.getByTestId("hook-len").textContent).toBe("1"),
    );
  });
});
