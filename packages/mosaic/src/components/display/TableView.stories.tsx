import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { EMPTY, Subject, of } from "rxjs";
import { TableView } from "./TableView";
import type { TableViewProps } from "./TableView.schema";

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
          "Pattern 4 — Streaming hydration table. Consumes an RxJS Observable<Row[]> for incremental row appending. Activates TanStack Virtual v3 windowing above `virtualizeThreshold`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableView>;

// ── Default — 200 rows static ─────────────────────────────────────────────────

export const Default: Story = {
  name: "Default (200 rows static)",
  render: () => (
    <TableView<Row>
      columns={columns}
      rows$={of(makeRows(200))}
      ariaLabel="Items table — 200 static rows"
      virtualizeThreshold={100}
      locale="en"
    />
  ),
};

// ── Loading — empty Observable, never emits ───────────────────────────────────

export const Loading: Story = {
  name: "Loading (Observable never emits)",
  render: () => {
    const subject = new Subject<Partial<Row>[]>();
    return (
      <TableView<Row>
        columns={columns}
        rows$={subject.asObservable()}
        ariaLabel="Items table — loading"
        virtualizeThreshold={100}
        locale="en"
      />
    );
  },
};

// ── ErrorState — invalid schema (empty columns) ───────────────────────────────

export const ErrorState: Story = {
  name: "Error (invalid schema — empty columns)",
  render: () => (
    <TableView
      columns={[] as unknown as TableViewProps<Row>["columns"]}
      rows$={EMPTY}
      ariaLabel="Bad table"
      locale="en"
    />
  ),
};

// ── Empty — Observable emits empty array ──────────────────────────────────────

export const Empty: Story = {
  name: "Empty (Observable emits [])",
  render: () => (
    <TableView<Row>
      columns={columns}
      rows$={of([])}
      ariaLabel="Items table — no data"
      virtualizeThreshold={100}
      locale="fr"
    />
  ),
};
