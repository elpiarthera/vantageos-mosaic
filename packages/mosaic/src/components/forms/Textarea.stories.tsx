// Storybook documentation for Textarea
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { FormProvider } from "../../runtimes/react/components/forms/FormProvider.js";
import { SubmitButton } from "../../runtimes/react/components/forms/SubmitButton.js";
import { Textarea } from "../../runtimes/react/components/forms/Textarea.js";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";

const meta: Meta = {
  title: "Forms/Textarea",
  parameters: {
    docs: {
      description: {
        component:
          "Multi-line text input. Wraps `FormField` (RHF Controller) and renders a " +
          "native `<textarea>` with `rows` default 3, optional `maxLength` gate " +
          "(logic-shared with the Preact runtime), and optional `autoResize`. Sets " +
          "`aria-invalid` + `aria-describedby` when the field has a validation error.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const schema = z.object({
  bio: z.string().min(10, "Bio must be at least 10 characters / Au moins 10 caractères"),
});

function Demo({
  rows,
  maxLength,
  autoResize,
}: {
  rows?: number;
  maxLength?: number;
  autoResize?: boolean;
}) {
  const form = useMosaicForm({ schema, defaultValues: { bio: "" } });
  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <Textarea
          name="bio"
          label="Bio / Biographie"
          placeholder="Tell us about yourself / Parlez-nous de vous"
          rows={rows}
          maxLength={maxLength}
          autoResize={autoResize}
        />
        <SubmitButton label="Submit" />
      </form>
    </FormProvider>
  );
}

export const Default: Story = {
  name: "Default (rows=3)",
  render: () => <Demo />,
};

export const WithMaxLength: Story = {
  name: "With maxLength (cap 50 chars)",
  render: () => <Demo maxLength={50} />,
};

export const AutoResize: Story = {
  name: "Auto-resize (grows with content)",
  render: () => <Demo autoResize={true} rows={2} />,
};
