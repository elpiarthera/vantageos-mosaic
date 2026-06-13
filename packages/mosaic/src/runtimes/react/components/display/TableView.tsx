/**
 * @vantageos/mosaic/react/display — TableView re-export (React 19 runtime).
 *
 * Re-exports from shared display implementation. The shared TableView.tsx is
 * cross-runtime: tsup react pass compiles it with react imports intact;
 * tsup preact pass aliases react → preact/compat per §18.1.
 *
 * i18nKeys: TableView.aria.table, TableView.pagination.next, TableView.pagination.prev,
 *           TableView.empty.message, TableView.error.invalidProps
 */
export { StreamingTableView, TableView } from "../../../../components/display/TableView.js";
export type {
  StreamingTableViewProps,
  TableViewProps,
} from "../../../../components/display/TableView.schema.js";
export {
  TableViewPropsSchema,
  validateTableViewProps,
} from "../../../../components/display/TableView.schema.js";
