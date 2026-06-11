// Storybook documentation for FormProvider
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { FormProvider } from "../../runtimes/react/components/forms/FormProvider.js";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";

const meta: Meta = {
  title: "Forms/FormProvider",
  parameters: {
    docs: {
      description: {
        component:
          "Wraps `react-hook-form`'s native `FormProvider` AND a Mosaic-specific " +
          "context exposing `mosaicSchema` + `mosaicMode`. Use `useMosaicFormContext()` " +
          "inside descendants to read the extended form return.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const schema = z.object({ name: z.string().min(1) });

function Demo() {
  const form = useMosaicForm({ schema, defaultValues: { name: "Mosaic" } });
  return (
    <FormProvider form={form}>
      <p>FormProvider rendered. mosaicMode = {form.mosaicMode}</p>
    </FormProvider>
  );
}

export const Default: Story = {
  name: "Default",
  render: () => <Demo />,
};
