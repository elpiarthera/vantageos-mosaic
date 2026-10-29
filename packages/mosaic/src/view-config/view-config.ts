import * as z from "zod";
import type { ColumnDef } from "../components/display/TableView.schema.js";

export const ViewConfigSchema = z.unknown();
export type ViewConfig = unknown;
export interface ConfigToolResult {
  content?: unknown[];
  structuredContent?: unknown;
  _meta?: Record<string, unknown>;
  isError?: boolean;
}
export interface ConfigViewBridge {
  callServerTool(p: {
    name: string;
    arguments?: Record<string, unknown>;
  }): Promise<ConfigToolResult>;
}
export class ViewConfigError extends Error {
  issues: string[] = [];
}
export function parseViewConfig(
  _raw: unknown,
): { ok: true; config: ViewConfig } | { ok: false; issues: string[] } {
  throw new Error("not implemented");
}
export function assertViewConfig(_raw: unknown): ViewConfig {
  throw new Error("not implemented");
}
export function resolveActionArgs(
  _args: Record<string, unknown>,
  _scope: { row?: unknown; record?: unknown },
): { ok: true; args: Record<string, unknown> } | { ok: false; missing: string } {
  throw new Error("not implemented");
}
export function actionVisible(
  _a: { when?: string },
  _scope: { row?: unknown; record?: unknown },
): boolean {
  throw new Error("not implemented");
}
export function pagingState(
  _c: ViewConfig,
  _payload: unknown,
): { cursor: string | undefined; exhausted: boolean; truncated: boolean } {
  throw new Error("not implemented");
}
export function toColumnDefs(_cols: ViewConfig["columns"], _l: "en" | "fr"): ColumnDef[] {
  throw new Error("not implemented");
}
export function listRows(
  _c: ViewConfig,
  _payload: unknown,
): { ok: true; rows: Record<string, unknown>[] } | { ok: false } {
  throw new Error("not implemented");
}
export function toolErrorText(_r: ConfigToolResult): string {
  throw new Error("not implemented");
}
export function pick(_t: { en: string; fr: string }, _l: "en" | "fr"): string {
  throw new Error("not implemented");
}
