import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Tabs } from "../../runtimes/react/components/input/Tabs";

const meta = {
  title: "Input/Tabs",
  component: Tabs,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    locale: { control: "select", options: ["en", "fr"] },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleTabs = [
  {
    id: "overview",
    label: "Overview",
    content: (
      <div className="p-4 text-sm text-slate-700">
        <h3 className="font-semibold mb-2">Project Overview</h3>
        <p>This is the overview tab content. It provides a high-level summary of the project.</p>
      </div>
    ),
  },
  {
    id: "details",
    label: "Details",
    content: (
      <div className="p-4 text-sm text-slate-700">
        <h3 className="font-semibold mb-2">Project Details</h3>
        <p>Detailed technical specifications and implementation notes go here.</p>
      </div>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    content: (
      <div className="p-4 text-sm text-slate-700">
        <h3 className="font-semibold mb-2">Settings</h3>
        <p>Configuration options and preferences for this project.</p>
      </div>
    ),
  },
];

export const Horizontal: Story = {
  args: {
    tabs: sampleTabs,
    orientation: "horizontal",
    locale: "en",
  },
};

export const Vertical: Story = {
  args: {
    tabs: sampleTabs,
    orientation: "vertical",
    locale: "en",
  },
};

export const WithDisabledTab: Story = {
  args: {
    tabs: [
      {
        id: "active",
        label: "Active",
        content: (
          <div className="p-4 text-sm text-slate-700">
            <p>This tab is active and accessible.</p>
          </div>
        ),
      },
      {
        id: "disabled",
        label: "Disabled",
        content: (
          <div className="p-4 text-sm text-slate-700">
            <p>This content is not reachable — the tab is disabled.</p>
          </div>
        ),
        disabled: true,
      },
      {
        id: "other",
        label: "Another",
        content: (
          <div className="p-4 text-sm text-slate-700">
            <p>This tab is also accessible. Keyboard nav skips the disabled one.</p>
          </div>
        ),
      },
    ],
    orientation: "horizontal",
    locale: "en",
  },
};
