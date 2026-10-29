// i18nKeys: ConfigView.error.invalidConfig, ConfigView.error.invalidData, ConfigView.error.toolFailed, ConfigView.error.actionArgs

import React, { useState } from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import {
  type ConfigToolResult,
  type ConfigViewBridge,
  type ViewConfigRowAction,
  pick,
  resolveActionArgs,
  toolErrorText,
} from "../../view-config/view-config.js";

/** A visible refusal: what is wrong, by name. Never replaced by a default view. */
export function Refusal({
  kind,
  issues,
  locale,
}: {
  kind: "invalidConfig" | "invalidData";
  issues: string[];
  locale: MosaicLocale;
}) {
  const key =
    kind === "invalidConfig" ? "ConfigView.error.invalidConfig" : "ConfigView.error.invalidData";
  return (
    <div role="alert" lang={locale}>
      <strong>{t(key, locale)}</strong>
      <ul>
        {issues.slice(0, 5).map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

/** Stand-in when no bridge is wired: the call fails visibly instead of doing nothing. */
const NO_BRIDGE: ConfigViewBridge = {
  callServerTool: () => Promise.reject(new Error("no host bridge")),
};

/**
 * Tool calls through the bridge, with the error state of the view. A failure (thrown, or an
 * `isError` result) becomes a visible message; arguments that cannot be resolved are never sent.
 */
export function useToolRunner(bridge: ConfigViewBridge | undefined, locale: MosaicLocale) {
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function call(
    name: string,
    args: Record<string, unknown>,
  ): Promise<ConfigToolResult | undefined> {
    setError(undefined);
    setBusy(true);
    let out: ConfigToolResult | undefined;
    try {
      const res = await (bridge ?? NO_BRIDGE).callServerTool({ name, arguments: args });
      if (res.isError) {
        setError(`${t("ConfigView.error.toolFailed", locale)}: ${toolErrorText(res)}`);
      } else {
        out = res;
      }
    } catch (e) {
      setError(`${t("ConfigView.error.toolFailed", locale)}: ${(e as Error).message}`);
    }
    setBusy(false);
    return out;
  }

  async function runAction(
    action: ViewConfigRowAction,
    scope: { row?: unknown; record?: unknown },
  ): Promise<ConfigToolResult | undefined> {
    const r = resolveActionArgs(action.args, scope);
    if (!r.ok) {
      setError(`${t("ConfigView.error.actionArgs", locale)}: ${r.missing}`);
      return undefined;
    }
    return call(action.tool, r.args);
  }

  return { call, runAction, error, setError, busy, canCall: bridge !== undefined };
}

export function ActionButton({
  action,
  locale,
  disabled,
  ariaLabel,
  onClick,
}: {
  action: ViewConfigRowAction;
  locale: MosaicLocale;
  disabled: boolean;
  ariaLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="mosaic-action"
      disabled={disabled || action.disabled === true}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {pick(action.label, locale)}
    </button>
  );
}

export function ErrorAlert({ message }: { message: string | undefined }) {
  return message ? <div role="alert">{message}</div> : null;
}
