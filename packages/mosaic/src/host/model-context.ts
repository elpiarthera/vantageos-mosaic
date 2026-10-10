/**
 * Typed `ui/update-model-context` content blocks (H03) and the `openai/modelContext` reader.
 *
 * Spec: openai/mcp-extensions docs/spec.md, "ui/update-model-context Extensions"
 * (local copy openai-mcp-ext-spec.md):
 *   l.1022  `_meta["openai/title"]`: non-empty string on `text` and `image` blocks.
 *   l.1042  `_meta["openai/thumbnail"]`: an `MCP.Icon` on `text` blocks (not yet on iOS, l.1046).
 *   l.1070  `annotations.audience: ["assistant"]` hides a block from the user (the model still
 *           receives it).
 *   l.1072  serialized `structuredContent` in a text block SHOULD set audience `["assistant"]`.
 *   l.945   `ui/update-model-context` is idempotent: each call replaces the app's previous context,
 *           so an empty `content` array is how a cleared selection is expressed.
 *   l.962-975 `hostContext["openai/modelContext"]` = `{ updateId, content?, structuredContent? }`
 *           or `null` once the user removed it.
 * Everything here is additive: a host that ignores `_meta` loses only the label.
 */
import { type MosaicLocale, t } from "../i18n/strings.js";
import type { ModelContextParams } from "./host-context.js";

/** `MCP.Icon` (the fields a thumbnail needs). */
export interface IconLike {
  src: string;
  mimeType?: string;
  sizes?: string[];
}

export type ModelContextBlock = { type: string; [key: string]: unknown };

export interface TextBlockOptions {
  /** `_meta["openai/title"]`: a human-readable label for the attachment. */
  title?: string;
  /** `_meta["openai/thumbnail"]`. */
  thumbnail?: IconLike;
  /** `annotations.audience: ["assistant"]`: context for the model, no composer attachment. */
  background?: boolean;
}

export type ModelContextHostState = {
  updateId: string;
  content?: ModelContextBlock[];
  structuredContent?: Record<string, unknown>;
} | null;

export function textBlock(text: string, options: TextBlockOptions = {}): ModelContextBlock {
  const { title, thumbnail, background } = options;
  if (title !== undefined && title.trim() === "") {
    throw new Error('textBlock: "openai/title" must be a non-empty string');
  }
  if (thumbnail !== undefined && !thumbnail.src) {
    throw new Error('textBlock: "openai/thumbnail" needs a src (MCP.Icon)');
  }
  const meta: Record<string, unknown> = {};
  if (title !== undefined) meta["openai/title"] = title;
  if (thumbnail !== undefined) meta["openai/thumbnail"] = thumbnail;
  return {
    type: "text",
    text,
    ...(Object.keys(meta).length > 0 ? { _meta: meta } : {}),
    ...(background ? { annotations: { audience: ["assistant"] } } : {}),
  };
}

/** Backward-compatible serialization of `structuredContent`, hidden from the user (spec l.1072). */
export function structuredContentBlock(value: Record<string, unknown>): ModelContextBlock {
  return textBlock(JSON.stringify(value), { background: true });
}

export function buildModelContext(input: {
  blocks?: ModelContextBlock[];
  structuredContent?: Record<string, unknown>;
}): ModelContextParams {
  return {
    ...(input.blocks !== undefined ? { content: input.blocks } : {}),
    ...(input.structuredContent !== undefined ? { structuredContent: input.structuredContent } : {}),
  };
}

/**
 * Reads `hostContext["openai/modelContext"]`. `undefined`: key absent or malformed; `null`:
 * the host reports the context cleared.
 */
export function readModelContextState(raw: unknown): ModelContextHostState | undefined {
  if (raw === null || typeof raw !== "object") return undefined;
  const v = (raw as Record<string, unknown>)["openai/modelContext"];
  if (v === null) return null;
  if (typeof v !== "object") return undefined;
  const state = v as Record<string, unknown>;
  if (typeof state.updateId !== "string" || state.updateId === "") return undefined;
  return {
    updateId: state.updateId,
    ...(Array.isArray(state.content) ? { content: state.content as ModelContextBlock[] } : {}),
    ...(state.structuredContent !== null && typeof state.structuredContent === "object"
      ? { structuredContent: state.structuredContent as Record<string, unknown> }
      : {}),
  };
}

/**
 * What the model should know about a table selection: one titled block listing each selected row
 * as `header: value` pairs. An empty selection yields an empty `content`, which replaces (clears)
 * the previous context because the call is idempotent per app instance.
 */
export function selectionModelContext(
  rows: Array<Record<string, unknown>>,
  columns: Array<{ key: string; header: string }>,
  locale: MosaicLocale = "en",
): ModelContextParams {
  if (rows.length === 0) return { content: [] };
  const title =
    rows.length === 1
      ? t("ModelContext.selection.one", locale)
      : t("ModelContext.selection.many", locale).replace("{n}", String(rows.length));
  const text = rows
    .map((row) => columns.map((c) => `${c.header}: ${String(row[c.key] ?? "")}`).join(", "))
    .join("\n");
  return { content: [textBlock(text, { title })] };
}
