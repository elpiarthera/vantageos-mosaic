// Storybook documentation for Input (forms category, T11)
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { FormProvider } from "../../runtimes/react/components/forms/FormProvider.js";
import { Input } from "../../runtimes/react/components/forms/Input.js";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";

const meta: Meta = {
  title: "Forms/Input",
  parameters: {
    docs: {
      description: {
        component:
          "Cross-runtime Input primitive bound to the surrounding `FormProvider` " +
          "via RHF's `Controller`. Supports text / email / password / number / url. " +
          "a11y: label + aria-invalid + aria-describedby wired automatically.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const textSchema = z.object({ username: z.string().min(2, "too_short") });

function TextDemo() {
  const form = useMosaicForm({ schema: textSchema, defaultValues: { username: "" } });
  return (
    <FormProvider form={form}>
      <Input name="username" type="text" label="Username" placeholder="laurent" />
    </FormProvider>
  );
}

export const Text: Story = {
  name: "Text (default)",
  render: () => <TextDemo />,
};

const emailSchema = z.object({ email: z.string().email("invalid_email") });

function EmailDemo() {
  const form = useMosaicForm({ schema: emailSchema, defaultValues: { email: "" } });
  return (
    <FormProvider form={form}>
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
      />
    </FormProvider>
  );
}

export const Email: Story = {
  name: "Email (with autoComplete)",
  render: () => <EmailDemo />,
};

const pwSchema = z.object({ pw: z.string().min(8, "too_short") });

function PasswordDisabledDemo() {
  const form = useMosaicForm({ schema: pwSchema, defaultValues: { pw: "" } });
  return (
    <FormProvider form={form}>
      <Input
        name="pw"
        type="password"
        label="Password"
        placeholder="********"
        autoComplete="new-password"
        disabled
      />
    </FormProvider>
  );
}

export const PasswordDisabled: Story = {
  name: "Password (disabled)",
  render: () => <PasswordDisabledDemo />,
};
