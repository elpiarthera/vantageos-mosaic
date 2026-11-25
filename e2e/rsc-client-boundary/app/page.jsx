// A Next.js App Router SERVER Component: this file carries no "use client", so every import below
// is evaluated in the React Server Components layer, exactly as the consumer example in
// packages/mosaic/docs/GA-RELEASE-V0.3.1.md section 6 ("React — Next.js (App Router)").
// `next build` prerenders this page, so a mosaic entry that reaches a client-only React API
// (useState, useEffect, createContext...) from the server layer fails the build.
import { Skeleton } from "@vantageos/mosaic";
import { TableView as RootCategoryTableView } from "@vantageos/mosaic/display";
import { TableView } from "@vantageos/mosaic/react/display";
import { StatusBadge } from "@vantageos/mosaic/react/media";
import { ProgressBar } from "@vantageos/mosaic/react/progress";
import { ViewConfigSchema } from "@vantageos/mosaic/view-config";

export const dynamic = "force-static";

const columns = [{ key: "name", header: "Name" }];
const rows = [{ id: "a", name: "Alpha" }];

export default function Page() {
  // The React-free entry must stay a SERVER module. Were it marked "use client", this import would
  // be a client reference and calling it here would throw during prerender.
  const probe = ViewConfigSchema.safeParse({ kind: "not-a-view-config" });
  if (probe.success) {
    throw new Error("view-config accepted an invalid document");
  }
  return (
    <main>
      <ProgressBar value={40} label="Upload" />
      <StatusBadge status="ok" variant="success" locale="en" />
      <TableView columns={columns} rows={rows} ariaLabel="Fixture table" />
      <RootCategoryTableView columns={columns} rows={rows} ariaLabel="Root category table" />
      <Skeleton />
      <p id="view-config">view-config parsed on the server: {String(probe.success)}</p>
    </main>
  );
}
