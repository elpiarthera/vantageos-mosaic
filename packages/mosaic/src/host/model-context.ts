// RED stub: behaviour lands in the next commit.
import type { ModelContextParams } from "./host-context.js";
export interface IconLike {
  src: string;
  mimeType?: string;
  sizes?: string[];
}
export type ModelContextBlock = { type: string; [key: string]: unknown };
export interface TextBlockOptions {
  title?: string;
  thumbnail?: IconLike;
  background?: boolean;
}
export type ModelContextHostState = {
  updateId: string;
  content?: ModelContextBlock[];
  structuredContent?: Record<string, unknown>;
} | null;
export function textBlock(text: string, _options?: TextBlockOptions): ModelContextBlock {
  return { type: "text", text };
}
export function structuredContentBlock(_value: Record<string, unknown>): ModelContextBlock {
  return { type: "text", text: "" };
}
export function buildModelContext(_input: {
  blocks?: ModelContextBlock[];
  structuredContent?: Record<string, unknown>;
}): ModelContextParams {
  return {};
}
export function readModelContextState(_raw: unknown): ModelContextHostState | undefined {
  return undefined;
}
export function selectionModelContext(
  _rows: Array<Record<string, unknown>>,
  _columns: Array<{ key: string; header: string }>,
  _locale?: "en" | "fr",
): ModelContextParams {
  return {};
}
