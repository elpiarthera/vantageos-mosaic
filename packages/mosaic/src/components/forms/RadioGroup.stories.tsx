// Storybook documentation for RadioGroup
import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { FormProvider } from "../../runtimes/react/components/forms/FormProvider.js";
import { RadioGroup } from "../../runtimes/react/components/forms/RadioGroup.js";
import { useMosaicForm } from "../../runtimes/react/components/forms/useMosaicForm.js";

const meta: Meta = {
  title: "Forms/RadioGroup",
  parameters: {
    docs: {
      description: {
        component:
          "WCAG-AA radiogroup primitive — mutually exclusive single choice. " +
          "Roving tabIndex, Arrow key navigation with selection sync, Home/End, " +
          "Space/Enter activation. Disabled options skipped during keyboard nav. " +
          "Wires to react-hook-form via the surrounding `<FormProvider>`.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const colorOptions = [
  { value: "red", label: "Red" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
];

const colorOptionsWithDesc = [
  { value: "red", label: "Red", description: "Bold and energetic" },
  { value: "green", label: "Green", description: "Calm and eco-friendly" },
  { value: "blue", label: "Blue", description: "Cool and trustworthy" },
];

const colorOptionsPartialDisabled = [
  { value: "red", label: "Red" },
  { value: "green", label: "Green", disabled: true },
  { value: "blue", label: "Blue" },
];

function VerticalDemo() {
  const schema = z.object({ color: z.string().min(1, "Please select a color") });
  const form = useMosaicForm({ schema, defaultValues: { color: "" } });
  return (
    <FormProvider form={form}>
      <form>
        <RadioGroup
          name="color"
          label="Pick a color"
          options={colorOptions}
          orientation="vertical"
        />
      </form>
    </FormProvider>
  );
}

function HorizontalDemo() {
  const schema = z.object({ size: z.string().min(1, "Please select a size") });
  const form = useMosaicForm({ schema, defaultValues: { size: "" } });
  return (
    <FormProvider form={form}>
      <form>
        <RadioGroup
          name="size"
          label="Select size"
          options={[
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
          ]}
          orientation="horizontal"
        />
      </form>
    </FormProvider>
  );
}

function WithDescriptionsDemo() {
  const schema = z.object({ color: z.string().min(1, "Please select a color") });
  const form = useMosaicForm({ schema, defaultValues: { color: "green" } });
  return (
    <FormProvider form={form}>
      <form>
        <RadioGroup
          name="color"
          label="Pick a color"
          options={colorOptionsWithDesc}
          orientation="vertical"
        />
      </form>
    </FormProvider>
  );
}

function PartialDisabledDemo() {
  const schema = z.object({ color: z.string().min(1, "Please select a color") });
  const form = useMosaicForm({ schema, defaultValues: { color: "" } });
  return (
    <FormProvider form={form}>
      <form>
        <RadioGroup
          name="color"
          label="Pick a color (Green unavailable)"
          options={colorOptionsPartialDisabled}
          orientation="vertical"
        />
      </form>
    </FormProvider>
  );
}

function GroupDisabledDemo() {
  const schema = z.object({ color: z.string() });
  const form = useMosaicForm({ schema, defaultValues: { color: "red" } });
  return (
    <FormProvider form={form}>
      <form>
        <RadioGroup
          name="color"
          label="Color (entire group disabled)"
          options={colorOptions}
          disabled
        />
      </form>
    </FormProvider>
  );
}

export const Vertical: Story = {
  name: "Vertical (default)",
  render: () => <VerticalDemo />,
};

export const Horizontal: Story = {
  name: "Horizontal layout",
  render: () => <HorizontalDemo />,
};

export const WithDescriptions: Story = {
  name: "With descriptions + pre-selected",
  render: () => <WithDescriptionsDemo />,
};

export const PartialDisabled: Story = {
  name: "Partial disabled (one option)",
  render: () => <PartialDisabledDemo />,
};

export const GroupDisabled: Story = {
  name: "Group disabled",
  render: () => <GroupDisabledDemo />,
};
