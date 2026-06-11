// Storybook documentation for Checkbox
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { Checkbox } from "../../runtimes/react/components/forms/Checkbox.js";
import { FormProvider } from "../../runtimes/react/components/forms/FormProvider.js";
import { SubmitButton } from "../../runtimes/react/components/forms/SubmitButton.js";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";

const meta: Meta = {
  title: "Forms/Checkbox",
  parameters: {
    docs: {
      description: {
        component:
          "Boolean checkbox form primitive with indeterminate state support. " +
          'Wraps `FormField` (RHF Controller) and renders a native `<input type="checkbox">` with ' +
          '`indeterminate` support via DOM ref (sets `.indeterminate = true` and `aria-checked="mixed"`), ' +
          "optional `description` wired via `aria-describedby`, and " +
          "`aria-invalid` + `aria-describedby` on validation error. Bilingual-ready: " +
          "all user-facing strings are caller-supplied.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

// ─── Simple (checked / unchecked) ─────────────────────────────────────────

const simpleSchema = z.object({
  accept: z.boolean().refine((v) => v === true, {
    message: "You must accept the terms / Vous devez accepter les conditions",
  }),
});

function SimpleDemo({ defaultChecked }: { defaultChecked: boolean }) {
  const form = useMosaicForm({
    schema: simpleSchema,
    defaultValues: { accept: defaultChecked },
  });
  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <Checkbox name="accept" label="Accept terms and conditions / Accepter les conditions" />
        <SubmitButton label="Submit / Envoyer" />
      </form>
    </FormProvider>
  );
}

export const Unchecked: Story = {
  name: "Simple — unchecked (default)",
  render: () => <SimpleDemo defaultChecked={false} />,
};

export const Checked: Story = {
  name: "Simple — checked",
  render: () => <SimpleDemo defaultChecked={true} />,
};

// ─── Indeterminate ─────────────────────────────────────────────────────────

const indeterminateSchema = z.object({
  selectAll: z.boolean(),
});

function IndeterminateDemo() {
  const form = useMosaicForm({
    schema: indeterminateSchema,
    defaultValues: { selectAll: false },
  });
  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <Checkbox name="selectAll" label="Select all / Tout sélectionner" indeterminate={true} />
        <SubmitButton label="Confirm / Confirmer" />
      </form>
    </FormProvider>
  );
}

export const Indeterminate: Story = {
  name: "Indeterminate — aria-checked=mixed",
  render: () => <IndeterminateDemo />,
};

// ─── With description ──────────────────────────────────────────────────────

const descriptionSchema = z.object({
  newsletter: z.boolean(),
});

function WithDescriptionDemo() {
  const form = useMosaicForm({
    schema: descriptionSchema,
    defaultValues: { newsletter: false },
  });
  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <Checkbox
          name="newsletter"
          label="Subscribe to newsletter / S'abonner à la lettre d'information"
          description="We send at most one email per week / Nous envoyons au maximum un courriel par semaine"
        />
        <SubmitButton label="Save / Enregistrer" />
      </form>
    </FormProvider>
  );
}

export const WithDescription: Story = {
  name: "With description (aria-describedby wired)",
  render: () => <WithDescriptionDemo />,
};
