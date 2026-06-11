// Storybook documentation for SubmitButton
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { FormProvider } from "../../runtimes/react/components/forms/FormProvider.js";
import { SubmitButton } from "../../runtimes/react/components/forms/SubmitButton.js";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";

const meta: Meta = {
  title: "Forms/SubmitButton",
  parameters: {
    docs: {
      description: {
        component:
          "Submit button bound to the surrounding `FormProvider`. Disabled while " +
          "`formState.isValid` is false OR `formState.isSubmitting` is true. While " +
          "submitting, the loading label replaces the default label.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const schema = z.object({ email: z.string().email() });

function Demo({ valid = true, label }: { valid?: boolean; label?: string }) {
  const form = useMosaicForm({
    schema,
    defaultValues: { email: valid ? "ok@example.com" : "bad" },
    mode: "onChange",
  });
  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <SubmitButton label={label} />
      </form>
    </FormProvider>
  );
}

export const Default: Story = {
  name: "Default label",
  render: () => <Demo valid={true} />,
};

export const CustomLabel: Story = {
  name: "Custom label",
  render: () => <Demo valid={true} label="Send message" />,
};

export const DisabledInvalid: Story = {
  name: "Disabled (invalid form)",
  render: () => <Demo valid={false} label="Send" />,
};
