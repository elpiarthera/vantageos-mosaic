import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { EMPTY, Subject } from "rxjs";
import { StreamingTableView, TableView } from "./TableView";
import type { StreamingTableViewProps, TableViewProps } from "./TableView.schema";

// ── Helpers ───────────────────────────────────────────────────────────────────

type Row = { id: number; name: string; status: string };

const STATUS_CYCLE = ["active", "pending", "archived"] as const;

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    status: STATUS_CYCLE[i % STATUS_CYCLE.length] ?? "active",
  }));
}

const columns: TableViewProps<Row>["columns"] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "status", header: "Status" },
];

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof TableView> = {
  title: "Display/TableView",
  component: TableView,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Static TableView — accepts `rows: Row[]` for already-fetched data (no rxjs required). For streaming data, use `StreamingTableView` with `rows$: Observable<Row[]>`. Activates TanStack Virtual v3 windowing above `virtualizeThreshold`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableView>;

// ── Default — 200 rows static array ──────────────────────────────────────────

export const Default: Story = {
  name: "Default (200 rows static array)",
  render: () => (
    <TableView<Row>
      columns={columns}
      rows={makeRows(200)}
      ariaLabel="Items table — 200 static rows"
      virtualizeThreshold={100}
      locale="en"
    />
  ),
};

// ── Small — 10 rows static array, no virtualization ───────────────────────────

export const Small: Story = {
  name: "Small (10 rows, no virtualization)",
  render: () => (
    <TableView<Row>
      columns={columns}
      rows={makeRows(10)}
      ariaLabel="Items table — 10 rows"
      virtualizeThreshold={100}
      locale="en"
    />
  ),
};

// ── Empty — static empty array ────────────────────────────────────────────────

export const Empty: Story = {
  name: "Empty (static empty array)",
  render: () => (
    <TableView<Row>
      columns={columns}
      rows={[]}
      ariaLabel="Items table — no data"
      virtualizeThreshold={100}
      locale="fr"
    />
  ),
};

// ── ErrorState — invalid schema (empty columns) ───────────────────────────────

export const ErrorState: Story = {
  name: "Error (invalid schema — empty columns)",
  render: () => (
    <TableView
      columns={[] as unknown as TableViewProps<Row>["columns"]}
      rows={[]}
      ariaLabel="Bad table"
      locale="en"
    />
  ),
};

// ── Streaming — StreamingTableView with Observable ────────────────────────────

type StreamingStory = StoryObj<typeof StreamingTableView>;

export const Streaming: StreamingStory = {
  name: "Streaming (Observable, never emits — loading state)",
  render: () => {
    const subject = new Subject<Partial<Row>[]>();
    return (
      <StreamingTableView<Row>
        columns={columns}
        rows$={subject.asObservable()}
        ariaLabel="Items table — streaming loading"
        virtualizeThreshold={100}
        locale="en"
      />
    );
  },
};

export const StreamingEmpty: StreamingStory = {
  name: "Streaming Empty (Observable emits [])",
  render: () => (
    <StreamingTableView<Row>
      columns={columns}
      rows$={EMPTY}
      ariaLabel="Items table — streaming no data"
      virtualizeThreshold={100}
      locale="fr"
    />
  ),
};
