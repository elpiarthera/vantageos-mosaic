// Storybook documentation for FormField
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { FormField } from "../../runtimes/react/components/forms/FormField.js";
import { FormProvider } from "../../runtimes/react/components/forms/FormProvider.js";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";

const meta: Meta = {
  title: "Forms/FormField",
  parameters: {
    docs: {
      description: {
        component:
          "Render-prop wrapper around RHF's `Controller`. Reads `control` from the " +
          "surrounding `FormProvider`. Children receive `{ field, fieldState, formState }`.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const schema = z.object({ email: z.string().email("Invalid email") });

function Demo() {
  const form = useMosaicForm({ schema, defaultValues: { email: "" } });
  return (
    <FormProvider form={form}>
      <FormField name="email">
        {({ field, fieldState }) => (
          <label>
            Email
            <input {...field} value={(field.value as string) ?? ""} />
            {fieldState.error ? <span role="alert">{fieldState.error.message}</span> : null}
          </label>
        )}
      </FormField>
    </FormProvider>
  );
}

export const Default: Story = {
  name: "Default (email field)",
  render: () => <Demo />,
};
