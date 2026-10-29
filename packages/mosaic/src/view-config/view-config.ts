/**
 * The view config (`view-config/1`): ONE JSON document per tool, held in data, that tells the
 * generic List and Detail views what to show. Runtime-validated here; an invalid config is
 * refused loudly by every consumer, never replaced by a default.
 *
 * Rules that keep it data: no function values, every label has `en` and `fr`, the currency is a
 * parameter of the `money` format, enum labels are rows of the `map`, a `path` reads only fields
 * the tool's output serves.
 *
 * Additions to the section E draft, both optional: `rowActions[].disabled` (an action shipped
 * disabled until its id correspondence is confirmed, flipped by editing data) and the strictness
 * (unknown keys are refused, `schemaVersion` carries evolution).
 */
import * as z from "zod";
import type { DetailViewProps } from "../components/display/DetailView.schema.js";
import type { ColumnDef } from "../components/display/TableView.schema.js";
import { ColumnFormatSchema, I18nTextSchema } from "../components/shared/format.js";
import { getPath } from "../components/shared/path.js";
import type { MosaicLocale as MosaicLocaleLike } from "../i18n/strings.js";

const Path = z.string().min(1);

/**
 * The whole-payload token. Valid ONLY as the `dataPath` of a Detail config, where it selects the
 * tool's `structuredContent` itself. It is not a JSONPath: `$.x` is an ordinary key path, and
 * every other path field (columns, fields, tables, totals, paging, `when`) reads keys literally.
 */
const ROOT_TOKEN = "$";

/** A List reads an array under a named key: the whole payload is never a list of rows. */
const ListDataPath = Path.refine((p) => p !== ROOT_TOKEN, {
  message: `"${ROOT_TOKEN}" (the whole payload) is a Detail-only dataPath; a list reads its rows under a named path`,
});

/** A Detail may read a named path or the whole payload (`"$"`). */
const DetailDataPath = Path;

const ColumnSchema = z.strictObject({
  id: z.string().min(1),
  path: Path,
  label: I18nTextSchema,
  format: ColumnFormatSchema.optional(),
  sortable: z.boolean().optional(),
  align: z.enum(["start", "center", "end"]).optional(),
});

const FieldSchema = z.strictObject({
  path: Path,
  label: I18nTextSchema,
  format: ColumnFormatSchema.optional(),
});

const SectionSchema = z
  .strictObject({
    id: z.string().min(1),
    title: I18nTextSchema,
    fields: z.array(FieldSchema).optional(),
    table: z.strictObject({ path: Path, columns: z.array(ColumnSchema).min(1) }).optional(),
  })
  .refine((s) => s.fields !== undefined || s.table !== undefined, {
    message: "a section needs fields or a table",
  });

const ArgValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const RowActionSchema = z.strictObject({
  tool: z.string().min(1),
  /** Values are literals, or `$row.<path>` (list) / `$.<path>` (detail). */
  args: z.record(z.string(), ArgValue),
  label: I18nTextSchema,
  /** Path that must be non-null for the action to be offered. */
  when: Path.optional(),
  /** Shipped disabled: rendered disabled, never calls the bridge. */
  disabled: z.boolean().optional(),
});

const TotalsFieldSchema = FieldSchema;

const PagingSchema = z.strictObject({
  cursorPath: Path.optional(),
  exhaustedPath: Path.optional(),
  truncatedPath: Path.optional(),
  cursorArg: Path.optional(),
  limitArg: Path.optional(),
  pageSize: z.number().int().positive().optional(),
});

const base = {
  schemaVersion: z.literal(1),
  tool: z.string().min(1),
  title: I18nTextSchema,
  rowActions: z.array(RowActionSchema).optional(),
};

const REF_ROW = /^\$row\..+$/;
const REF_REC = /^\$\..+$/;

function checkActions(
  actions: z.output<typeof RowActionSchema>[] | undefined,
  allowed: RegExp,
  ctx: z.RefinementCtx,
) {
  for (const [i, a] of (actions ?? []).entries()) {
    for (const [k, v] of Object.entries(a.args)) {
      if (typeof v === "string" && v.startsWith("$") && !allowed.test(v)) {
        ctx.addIssue({
          code: "custom",
          path: ["rowActions", i, "args", k],
          message: `unsupported reference "${v}" for this view kind`,
        });
      }
    }
  }
}

const ListConfigSchema = z
  .strictObject({
    ...base,
    kind: z.literal("list"),
    dataPath: ListDataPath,
    rowKey: Path.optional(),
    columns: z.array(ColumnSchema).min(1),
    defaultSort: z
      .strictObject({ column: z.string().min(1), direction: z.enum(["asc", "desc"]) })
      .optional(),
    paging: PagingSchema.optional(),
    totals: z.array(TotalsFieldSchema).optional(),
    totalsScope: z
      .strictObject({
        scopePath: Path.optional(),
        completePath: Path.optional(),
        notePath: Path.optional(),
      })
      .optional(),
    emptyMessage: I18nTextSchema.optional(),
  })
  .superRefine((c, ctx) => {
    const ids = c.columns.map((x) => x.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", path: ["columns"], message: "column ids must be unique" });
    }
    if (c.defaultSort && !ids.includes(c.defaultSort.column)) {
      ctx.addIssue({
        code: "custom",
        path: ["defaultSort", "column"],
        message: `defaultSort names no column: "${c.defaultSort.column}"`,
      });
    }
    checkActions(c.rowActions, REF_ROW, ctx);
  });

const DetailConfigSchema = z
  .strictObject({
    ...base,
    kind: z.literal("detail"),
    dataPath: DetailDataPath,
    sections: z.array(SectionSchema).min(1),
  })
  .superRefine((c, ctx) => checkActions(c.rowActions, REF_REC, ctx));

export const ViewConfigSchema = z.discriminatedUnion("kind", [
  ListConfigSchema,
  DetailConfigSchema,
]);

export type ViewConfig = z.output<typeof ViewConfigSchema>;
export type ListViewConfig = z.output<typeof ListConfigSchema>;
export type DetailViewConfig = z.output<typeof DetailConfigSchema>;
export type ViewConfigRowAction = z.output<typeof RowActionSchema>;
export type ViewConfigSection = z.output<typeof SectionSchema>;

/** Thrown by the loud entry points when a config (or a payload against it) is unusable. */
export class ViewConfigError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`invalid view config: ${issues.join("; ")}`);
    this.name = "ViewConfigError";
    this.issues = issues;
  }
}

export function parseViewConfig(
  raw: unknown,
): { ok: true; config: ViewConfig } | { ok: false; issues: string[] } {
  const r = ViewConfigSchema.safeParse(raw);
  if (r.success) return { ok: true, config: r.data };
  return {
    ok: false,
    issues: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
  };
}

export function assertViewConfig(raw: unknown): ViewConfig {
  const r = parseViewConfig(raw);
  if (!r.ok) throw new ViewConfigError(r.issues);
  return r.config;
}

// ── Bridge (structural subset of the ext-apps `App`) ─────────────────────────

export interface ConfigToolResult {
  content?: unknown[];
  structuredContent?: unknown;
  _meta?: Record<string, unknown>;
  isError?: boolean;
}

export interface ConfigViewBridge {
  callServerTool(params: {
    name: string;
    arguments?: Record<string, unknown>;
  }): Promise<ConfigToolResult>;
}

/** The text blocks of an error result, joined; untrusted, to be rendered as text only. */
export function toolErrorText(r: ConfigToolResult): string {
  return (r.content ?? [])
    .map((b) => (b as { type?: string; text?: unknown }) ?? {})
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("\n");
}

// ── Pure helpers shared by the views and the markdown twin ───────────────────

export function pick(text: { en: string; fr: string }, locale: MosaicLocaleLike): string {
  return text[locale];
}

export function toColumnDefs(
  columns: z.output<typeof ColumnSchema>[],
  locale: MosaicLocaleLike,
): ColumnDef[] {
  return columns.map((c) => ({
    key: c.id,
    header: pick(c.label, locale),
    path: c.path,
    ...(c.format ? { format: c.format } : {}),
    ...(c.sortable ? { sortable: true } : {}),
    ...(c.align ? { align: c.align } : {}),
  }));
}

export function listRows(
  config: ListViewConfig,
  payload: unknown,
): { ok: true; rows: Record<string, unknown>[] } | { ok: false } {
  const rows = getPath(payload, config.dataPath);
  return Array.isArray(rows)
    ? { ok: true, rows: rows as Record<string, unknown>[] }
    : { ok: false };
}

export function pagingState(
  config: ListViewConfig,
  payload: unknown,
): { cursor: string | undefined; exhausted: boolean; truncated: boolean } {
  const p = config.paging;
  const at = (path: string | undefined) => (path ? getPath(payload, path) : undefined);
  const cursor = at(p?.cursorPath);
  return {
    cursor: typeof cursor === "string" && cursor !== "" ? cursor : undefined,
    exhausted: p?.cursorPath === undefined ? true : at(p.exhaustedPath) === true,
    truncated: at(p?.truncatedPath) === true,
  };
}

type Scope = { row?: unknown; record?: unknown };

function resolveRef(ref: string, scope: Scope): unknown {
  return ref.startsWith("$row.")
    ? getPath(scope.row, ref.slice(5))
    : getPath(scope.record, ref.slice(2));
}

/** Resolves action args; a reference that reads nothing is reported by name, never sent as undefined. */
export function resolveActionArgs(
  args: Record<string, unknown>,
  scope: Scope,
): { ok: true; args: Record<string, unknown> } | { ok: false; missing: string } {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === "string" && v.startsWith("$")) {
      const value = resolveRef(v, scope);
      if (value === undefined || value === null) return { ok: false, missing: v };
      out[k] = value;
    } else {
      out[k] = v;
    }
  }
  return { ok: true, args: out };
}

/** `when` is a path (relative to the row or the record) that must be non-null. */
export function actionVisible(action: { when?: string }, scope: Scope): boolean {
  if (action.when === undefined) return true;
  const v = getPath(scope.row !== undefined ? scope.row : scope.record, action.when);
  return v !== undefined && v !== null;
}

// ── Detail helpers ───────────────────────────────────────────────────────────

/**
 * The records a detail view shows: `dataPath` may point to one object or to a list of them, or be
 * `"$"` to read the whole payload the same way. A payload that has neither is a mismatch, reported
 * by name, never an empty default.
 */
export function detailRecords(
  config: DetailViewConfig,
  payload: unknown,
): { ok: true; records: Record<string, unknown>[] } | { ok: false } {
  const data = config.dataPath === ROOT_TOKEN ? payload : getPath(payload, config.dataPath);
  if (Array.isArray(data)) return { ok: true, records: data as Record<string, unknown>[] };
  if (data !== null && typeof data === "object") {
    return { ok: true, records: [data as Record<string, unknown>] };
  }
  return { ok: false };
}

/**
 * DetailView props for one record. A table path that is absent shows an empty table; one that
 * reads something other than a list is a mismatch (`ok: false`, naming the path).
 */
export function buildDetailViewProps(
  config: DetailViewConfig,
  record: unknown,
  locale: MosaicLocaleLike,
): { ok: true; props: DetailViewProps } | { ok: false; issues: string[] } {
  const issues: string[] = [];
  const sections = config.sections.map((s) => {
    const table = s.table;
    let rows: Record<string, unknown>[] = [];
    if (table) {
      const at = getPath(record, table.path);
      if (Array.isArray(at)) rows = at as Record<string, unknown>[];
      else if (at !== undefined && at !== null) issues.push(`${table.path}: not a list`);
    }
    return {
      id: s.id,
      title: pick(s.title, locale),
      fields: (s.fields ?? []).map((f) => ({
        label: pick(f.label, locale),
        value: getPath(record, f.path),
        ...(f.format ? { format: f.format } : {}),
      })),
      ...(table ? { table: { columns: toColumnDefs(table.columns, locale), rows } } : {}),
    };
  });
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, props: { title: pick(config.title, locale), sections, locale } };
}

/** The first labelled field of a record, to name it in a chooser; undefined when there is none. */
export function recordLabel(config: DetailViewConfig, record: unknown): string | undefined {
  const first = config.sections.find((s) => (s.fields?.length ?? 0) > 0)?.fields?.[0];
  const v = first ? getPath(record, first.path) : undefined;
  return v === undefined || v === null || v === "" ? undefined : String(v);
}
