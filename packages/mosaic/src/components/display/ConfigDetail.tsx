import type { ConfigToolResult, ConfigViewBridge } from "../../view-config/view-config.js";
export interface ConfigDetailProps {
  config: unknown;
  payload: unknown;
  locale?: "en" | "fr";
  bridge?: ConfigViewBridge;
  onResult?: (r: ConfigToolResult) => void;
}
export function ConfigDetail(_p: ConfigDetailProps) {
  return null;
}
