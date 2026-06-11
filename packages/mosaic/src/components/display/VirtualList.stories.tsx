import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { VirtualList } from "./VirtualList";
import type { VirtualListProps } from "./VirtualList.schema";

// ── Helpers ───────────────────────────────────────────────────────────────────

type Item = { id: number; label: string; description: string };

function makeItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    label: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
  }));
}

function DefaultRow({ item }: { item: Item }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      }}
    >
      <span style={{ fontWeight: 600 }}>{item.label}</span>
      <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>{item.description}</span>
    </div>
  );
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof VirtualList> = {
  title: "Display/VirtualList",
  component: VirtualList,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "VirtualList — generic virtualized list component. Uses @tanstack/react-virtual v3 for windowing. Cross-runtime (React 19 + Preact 10). When `onRowClick` is provided, rows become keyboard-activable (role=button + tabIndex=0 + Enter/Space) per WCAG-AA §18.21.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VirtualList<Item>>;

// ── Story 1: Minimal — basic list, no interaction ─────────────────────────────

export const Minimal: Story = {
  name: "Minimal (20 items, fixed height)",
  render: () => (
    <div style={{ width: 400 }}>
      <VirtualList<Item>
        items={makeItems(20)}
        itemHeight={60}
        renderItem={(item) => <DefaultRow item={item} />}
        locale="en"
      />
    </div>
  ),
};

// ── Story 2: Clickable — onRowClick with a11y ─────────────────────────────────

export const Clickable: Story = {
  name: "Clickable (onRowClick + a11y role=button)",
  render: () => {
    const [lastClicked, setLastClicked] = React.useState<string | null>(null);
    return (
      <div style={{ width: 400 }}>
        {lastClicked && (
          <div
            style={{
              marginBottom: 12,
              padding: "8px 12px",
              background: "#f0fdf4",
              borderRadius: 6,
              fontSize: "0.875rem",
            }}
          >
            Last clicked: <strong>{lastClicked}</strong>
          </div>
        )}
        <VirtualList<Item>
          items={makeItems(30)}
          itemHeight={60}
          renderItem={(item) => (
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#e0e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "#4338ca",
                  flexShrink: 0,
                }}
              >
                {item.id}
              </span>
              <span style={{ fontWeight: 500 }}>{item.label}</span>
            </div>
          )}
          onRowClick={(item) => setLastClicked(item.label)}
          locale="en"
        />
        <p style={{ marginTop: 8, fontSize: "0.75rem", color: "#6b7280" }}>
          Click or press Enter/Space on a row to activate it.
        </p>
      </div>
    );
  },
};

// ── Story 3: Large dataset — 10000 items, virtualization demo ─────────────────

export const LargeDataset: Story = {
  name: "Large dataset (10 000 items — virtualization)",
  render: () => (
    <div style={{ width: 400 }}>
      <p style={{ marginBottom: 8, fontSize: "0.875rem", color: "#6b7280" }}>
        10 000 items — only visible rows are rendered in the DOM at any time.
      </p>
      <VirtualList<Item>
        items={makeItems(10000)}
        itemHeight={48}
        renderItem={(item, index) => (
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{item.label}</span>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>#{index + 1}</span>
          </div>
        )}
        locale="en"
      />
    </div>
  ),
};

// ── Story 4: Empty state ──────────────────────────────────────────────────────

export const Empty: Story = {
  name: "Empty state (EN + FR)",
  render: () => (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
      <div style={{ width: 300 }}>
        <p style={{ marginBottom: 8, fontSize: "0.875rem", fontWeight: 600 }}>EN locale</p>
        <VirtualList<Item>
          items={[]}
          itemHeight={40}
          renderItem={(item) => <DefaultRow item={item} />}
          locale="en"
        />
      </div>
      <div style={{ width: 300 }}>
        <p style={{ marginBottom: 8, fontSize: "0.875rem", fontWeight: 600 }}>FR locale</p>
        <VirtualList<Item>
          items={[]}
          itemHeight={40}
          renderItem={(item) => <DefaultRow item={item} />}
          locale="fr"
        />
      </div>
    </div>
  ),
};
