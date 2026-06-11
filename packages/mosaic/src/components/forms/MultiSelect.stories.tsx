// Storybook documentation for MultiSelect
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { FormProvider } from "../../runtimes/react/components/forms/FormProvider.js";
import { MultiSelect } from "../../runtimes/react/components/forms/MultiSelect.js";
import { SubmitButton } from "../../runtimes/react/components/forms/SubmitButton.js";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";

const meta: Meta = {
  title: "Forms/MultiSelect",
  parameters: {
    docs: {
      description: {
        component:
          "Multi-value dropdown. Wraps `FormField` (RHF Controller) and renders a " +
          "WCAG-AA combobox with selected items rendered as removable chips. " +
          "Backspace/Delete remove the last chip; per-chip close icon removes that " +
          "specific chip. Optional `searchable` and `maxItems`. RHF value is `string[]`.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const OPTIONS = [
  { value: "fr", label: "France / France" },
  { value: "es", label: "Spain / Espagne" },
  { value: "de", label: "Germany / Allemagne" },
  { value: "it", label: "Italy / Italie" },
  { value: "pt", label: "Portugal / Portugal" },
];

function Demo({
  searchable,
  maxItems,
  defaultValues = { countries: [] as string[] },
}: {
  searchable?: boolean;
  maxItems?: number;
  defaultValues?: { countries: string[] };
}) {
  const schema = z.object({
    countries: z.array(z.string()).min(1, "Pick at least one / Au moins un"),
  });
  const form = useMosaicForm({ schema, defaultValues });
  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <MultiSelect
          name="countries"
          label="Countries / Pays"
          options={OPTIONS}
          placeholder="Pick countries / Choisir des pays"
          searchable={searchable}
          maxItems={maxItems}
        />
        <SubmitButton label="Submit" />
      </form>
    </FormProvider>
  );
}

export const Default: Story = {
  name: "Default (no search, no cap)",
  render: () => <Demo />,
};

export const Searchable: Story = {
  name: "Searchable (filter on label/value)",
  render: () => <Demo searchable />,
};

export const MaxItemsReached: Story = {
  name: "maxItems = 2 (cap reached)",
  render: () => <Demo maxItems={2} defaultValues={{ countries: ["fr", "es"] }} />,
};
