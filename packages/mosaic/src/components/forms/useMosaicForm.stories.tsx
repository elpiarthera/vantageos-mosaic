// Storybook documentation for useMosaicForm
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { z } from "zod";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";

const meta: Meta = {
  title: "Forms/useMosaicForm",
  parameters: {
    docs: {
      description: {
        component:
          "Cross-runtime hook wrapping `react-hook-form` + `@hookform/resolvers/zod`. " +
          "Default validation mode is `onBlur` (Chi co-validated, Day 102). The return " +
          "object extends RHF's `UseFormReturn` with `mosaicSchema` + `mosaicMode` metadata.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const schema = z.object({
  email: z.string().email("Invalid email"),
  age: z.number().min(18, "Must be 18+"),
});

function DefaultDemo() {
  const form = useMosaicForm({
    schema,
    defaultValues: { email: "user@example.com", age: 22 },
  });
  useEffect(() => {
    void form.trigger();
  }, [form]);
  return (
    <pre data-testid="useMosaicForm-output">
      {JSON.stringify(
        {
          mosaicMode: form.mosaicMode,
          isValid: form.formState.isValid,
          values: form.getValues(),
        },
        null,
        2,
      )}
    </pre>
  );
}

/** Default story — onBlur mode + valid initial values */
export const Default: Story = {
  name: "Default (onBlur)",
  render: () => <DefaultDemo />,
};

function OnChangeDemo() {
  const form = useMosaicForm({
    schema,
    defaultValues: { email: "bad", age: 5 },
    mode: "onChange",
  });
  return <pre>{JSON.stringify({ mosaicMode: form.mosaicMode }, null, 2)}</pre>;
}

export const OnChangeMode: Story = {
  name: "Mode override (onChange)",
  render: () => <OnChangeDemo />,
};
