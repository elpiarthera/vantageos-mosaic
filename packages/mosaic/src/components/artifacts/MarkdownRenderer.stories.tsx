import type { Meta, StoryObj } from "@storybook/react";
import type React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

const meta: Meta = {
  title: "Artifacts/MarkdownRenderer",
  component: MarkdownRenderer as React.ComponentType<unknown>,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content:
      "# Welcome\n\nThis is a **markdown** document with _italic_ text and [a link](https://example.com).\n\n## Section\n\n- Item one\n- Item two\n- Item three",
    locale: "en",
  },
};

export const Loading: Story = {
  args: {
    content: "_Loading content…_",
    locale: "en",
  },
};

export const ErrorState: Story = {
  args: {
    content: 42,
    locale: "invalid",
  },
};

export const Empty: Story = {
  args: {
    content: "",
    locale: "fr",
  },
};
