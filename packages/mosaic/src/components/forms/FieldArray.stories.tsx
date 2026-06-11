// Storybook documentation for FieldArray (DYNAMIQUE form primitive)
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { FieldArray } from "../../runtimes/react/components/forms/FieldArray.js";
import { FormField } from "../../runtimes/react/components/forms/FormField.js";
import { FormProvider } from "../../runtimes/react/components/forms/FormProvider.js";
import { SubmitButton } from "../../runtimes/react/components/forms/SubmitButton.js";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";

const meta: Meta = {
  title: "Forms/FieldArray",
  parameters: {
    docs: {
      description: {
        component:
          "DYNAMIQUE form primitive — thin render-prop wrapper around RHF's " +
          "`useFieldArray`. Reads `control` from the surrounding `FormProvider`. " +
          "Emits `role='list'` on the container and `role='listitem'` per row, " +
          "keyed by RHF's stable `field.id` (NOT array index — required for " +
          "stable React reconciliation across move/remove). Powers PromptForm " +
          "Add Variable, Hermes variable mappings, Demeter filter chips.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;
type Vars = { vars: { value: string }[] };

// ─── 1. Minimal — append + remove ───────────────────────────────────────────

function MinimalDemo() {
  const schema = z.object({
    vars: z.array(z.object({ value: z.string().min(1, "required") })),
  });
  const form = useMosaicForm({
    schema,
    defaultValues: { vars: [{ value: "first" }] },
  });
  return (
    <FormProvider form={form}>
      <FieldArray<Vars, "vars"> name="vars">
        {({ index }, { append, remove, fields }) => (
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <FormField name={`vars.${index}.value` as never}>
              {({ field }) => (
                <input
                  type="text"
                  value={(field.value as string) ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-label={`var ${index + 1}`}
                />
              )}
            </FormField>
            <button
              type="button"
              aria-label={`Remove vars item ${index + 1}`}
              onClick={() => remove(index)}
            >
              ✕
            </button>
            {index === fields.length - 1 ? (
              <button
                type="button"
                aria-label="Add vars item"
                onClick={() =>
                  // biome-ignore lint/suspicious/noExplicitAny: erased generic
                  append({ value: "" } as any)
                }
              >
                + Add
              </button>
            ) : null}
          </div>
        )}
      </FieldArray>
    </FormProvider>
  );
}

export const Minimal: Story = {
  name: "Minimal — append + remove",
  render: () => <MinimalDemo />,
};

// ─── 2. Ordered — with move buttons ─────────────────────────────────────────

function OrderedDemo() {
  const schema = z.object({
    vars: z.array(z.object({ value: z.string() })),
  });
  const form = useMosaicForm({
    schema,
    defaultValues: {
      vars: [{ value: "alpha" }, { value: "beta" }, { value: "gamma" }],
    },
  });
  return (
    <FormProvider form={form}>
      <FieldArray<Vars, "vars"> name="vars">
        {({ index }, { append, remove, move, fields }) => (
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            <FormField name={`vars.${index}.value` as never}>
              {({ field }) => (
                <input
                  type="text"
                  value={(field.value as string) ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-label={`row ${index + 1}`}
                />
              )}
            </FormField>
            <button
              type="button"
              aria-label={`Move row ${index + 1} up`}
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move row ${index + 1} down`}
              disabled={index === fields.length - 1}
              onClick={() => move(index, index + 1)}
            >
              ↓
            </button>
            <button
              type="button"
              aria-label={`Remove row ${index + 1}`}
              onClick={() => remove(index)}
            >
              ✕
            </button>
            {index === fields.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  // biome-ignore lint/suspicious/noExplicitAny: erased generic
                  append({ value: "" } as any)
                }
              >
                + Add
              </button>
            ) : null}
          </div>
        )}
      </FieldArray>
    </FormProvider>
  );
}

export const Ordered: Story = {
  name: "Ordered — with move buttons",
  render: () => <OrderedDemo />,
};

// ─── 3. PromptForm-clone use case — variable substitution form ──────────────

type PromptVars = {
  variables: { key: string; defaultValue: string }[];
};

function PromptFormCloneDemo() {
  const schema = z.object({
    variables: z.array(
      z.object({
        key: z.string().min(1, "key required"),
        defaultValue: z.string(),
      }),
    ),
  });
  const form = useMosaicForm({
    schema,
    defaultValues: {
      variables: [{ key: "username", defaultValue: "anonymous" }],
    },
  });
  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <FieldArray<PromptVars, "variables"> name="variables">
          {({ index }, { append, remove, fields }) => (
            <fieldset
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: 8,
                marginBottom: 8,
                padding: 8,
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            >
              <FormField name={`variables.${index}.key` as never}>
                {({ field }) => (
                  <input
                    type="text"
                    placeholder="key"
                    value={(field.value as string) ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-label={`variable ${index + 1} key`}
                  />
                )}
              </FormField>
              <FormField name={`variables.${index}.defaultValue` as never}>
                {({ field }) => (
                  <input
                    type="text"
                    placeholder="default value"
                    value={(field.value as string) ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-label={`variable ${index + 1} default`}
                  />
                )}
              </FormField>
              <button
                type="button"
                aria-label={`Remove variable ${index + 1}`}
                onClick={() => remove(index)}
              >
                Delete
              </button>
              {index === fields.length - 1 ? (
                <button
                  type="button"
                  style={{ gridColumn: "1 / -1" }}
                  onClick={() =>
                    append({
                      key: "",
                      defaultValue: "",
                      // biome-ignore lint/suspicious/noExplicitAny: erased generic
                    } as any)
                  }
                >
                  + Add variable
                </button>
              ) : null}
            </fieldset>
          )}
        </FieldArray>
        <SubmitButton label="Save prompt" />
      </form>
    </FormProvider>
  );
}

export const PromptFormClone: Story = {
  name: "PromptForm-clone — variable substitution",
  render: () => <PromptFormCloneDemo />,
};
