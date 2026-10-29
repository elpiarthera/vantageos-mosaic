import type { ConfigToolResult, ConfigViewBridge } from "../../view-config/view-config.js";
export interface ConfigListProps {
  config: unknown;
  payload: unknown;
  locale?: "en" | "fr";
  toolArgs?: Record<string, unknown>;
  bridge?: ConfigViewBridge;
  onResult?: (r: ConfigToolResult) => void;
}
export function ConfigList(_p: ConfigListProps) {
  return null;
}
