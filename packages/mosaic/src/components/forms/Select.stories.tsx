// Storybook documentation for Select
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { FormProvider } from "../../runtimes/react/components/forms/FormProvider.js";
import { Select } from "../../runtimes/react/components/forms/Select.js";
import { SubmitButton } from "../../runtimes/react/components/forms/SubmitButton.js";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";
import type { SelectOption } from "./Select.schema.js";

const meta: Meta = {
  title: "Forms/Select",
  parameters: {
    docs: {
      description: {
        component:
          "Single-select dropdown primitive — combobox+listbox APG pattern. " +
          "Wraps `FormField` (RHF Controller) and renders a trigger button (role=combobox) " +
          "opening a listbox popup. Optional in-popup search filters the visible " +
          "options client-side. Full keyboard navigation: ArrowUp/Down, Home, End, " +
          "Enter, Esc, type-ahead. WCAG-AA strict: aria-expanded, aria-controls, " +
          "aria-haspopup=listbox, aria-activedescendant tracking. Cross-runtime " +
          "(React 19 + Preact 10).",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const COUNTRY_OPTIONS: SelectOption[] = [
  { value: "fr", label: "France / France", disabled: false },
  { value: "us", label: "United States / États-Unis", disabled: false },
  { value: "de", label: "Germany / Allemagne", disabled: false },
  { value: "jp", label: "Japan / Japon", disabled: false },
  { value: "ca", label: "Canada / Canada", disabled: false },
  { value: "es", label: "Spain / Espagne", disabled: false },
  { value: "it", label: "Italy / Italie", disabled: false },
  { value: "pt", label: "Portugal / Portugal", disabled: false },
];

const COUNTRY_OPTIONS_WITH_DISABLED: SelectOption[] = [
  { value: "fr", label: "France / France", disabled: false },
  { value: "us", label: "United States / États-Unis", disabled: false },
  { value: "de", label: "Germany / Allemagne", disabled: true },
  { value: "jp", label: "Japan / Japon", disabled: false },
  { value: "ru", label: "Russia / Russie", disabled: true },
  { value: "ca", label: "Canada / Canada", disabled: false },
];

const schema = z.object({
  country: z
    .string({ required_error: "Please select a country / Veuillez sélectionner un pays" })
    .min(1),
});

function Demo({
  searchable,
  disabled,
  options,
}: {
  searchable?: boolean;
  disabled?: boolean;
  options?: typeof COUNTRY_OPTIONS;
}) {
  const form = useMosaicForm({ schema, defaultValues: { country: "" } });
  return (
    <div className="max-w-sm">
      <FormProvider form={form}>
        <form onSubmit={form.handleSubmit(() => undefined)}>
          <Select
            name="country"
            label="Country / Pays"
            options={options ?? COUNTRY_OPTIONS}
            placeholder="Select a country / Sélectionnez un pays"
            searchable={searchable}
            disabled={disabled}
          />
          <div className="mt-4">
            <SubmitButton label="Submit / Envoyer" />
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

export const Default: Story = {
  name: "Default (simple dropdown)",
  render: () => <Demo />,
};

export const Searchable: Story = {
  name: "Searchable (with search input)",
  render: () => <Demo searchable={true} />,
};

export const WithDisabledOption: Story = {
  name: "With disabled option",
  render: () => <Demo options={COUNTRY_OPTIONS_WITH_DISABLED} />,
};

export const Disabled: Story = {
  name: "Disabled (entire control)",
  render: () => <Demo disabled={true} />,
};
