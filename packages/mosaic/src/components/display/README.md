# TableView

**Category:** display · **a11y:** WCAG-AA · **sizeLimit:** 80 KB

## Purpose

Streaming-ready data table — consumes `Observable<Partial<Row>[]>` and
activates TanStack-Virtual windowing above `virtualizeThreshold`. CORE pattern:
15 VP instances + 3 Theta filtered-table variants.

## Props

See `TableView.schema.ts` (`TableViewPropsSchema` validates serialisable subset;
`rows$` and `col.render` are typed at the TS level only):

| Key                   | Type                                              | Default | Notes                          |
| --------------------- | ------------------------------------------------- | ------- | ------------------------------ |
| `columns`             | `ColumnDef<TRow>[]` (≥1)                          | —       | `key`, `header`, optional `render` |
| `rows$`               | `Observable<Partial<TRow>[]>`                     | —       | Streaming source               |
| `virtualizeThreshold` | `number` (positive int)                           | `100`   | Switches to virtual rendering  |
| `ariaLabel`           | `string` (≥1)                                     | —       | Required for screen readers    |
| `locale`              | `'en' \| 'fr'`                                    | `'en'`  | Mosaic locale                  |

## Usage

```tsx
const rows$ = subject.asObservable();
<TableView
  columns={[
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
  ]}
  rows$={rows$}
  virtualizeThreshold={200}
  ariaLabel="Customers"
  locale="en"
/>;
```

## Accessibility

- Semantic `<table>` with `aria-label`, `aria-rowcount`, `scope="col"`.
- Virtual rows preserve `aria-rowindex` for AT navigation.
- Empty state cell carries `aria-label` + localised message.
- Validation failure renders `role="alert"` fallback.

## i18n keys

Defined in `TableView.i18n.json`:

- `TableView.aria.table`
- `TableView.pagination.next`, `TableView.pagination.prev`
- `TableView.empty.message`
- `TableView.error.invalidProps`

## Eval cases

`eval-corpus.json` covers happy (200 rows static), edge (250 rows virtual), and
failure (empty columns array → role=alert).
