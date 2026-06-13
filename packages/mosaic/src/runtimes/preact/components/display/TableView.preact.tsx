/**
 * @vantageos/mosaic/preact/display — TableView re-export (Preact 10 runtime).
 *
 * Re-exports from shared display implementation. The tsup preact pass aliases
 * react → preact/compat and react-dom → preact/compat at build time per §18.1,
 * so the shared TableView.tsx (useState, useCallback, useRef, useEffect +
 * @tanstack/react-virtual) compiles to Preact hooks/JSX automatically.
 * No source duplication required.
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
