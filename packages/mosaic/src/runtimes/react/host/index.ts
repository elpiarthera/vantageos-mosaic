/**
 * @vantageos/mosaic/react/host — React hooks over the framework-agnostic host-context core.
 */
import { useCallback, useEffect, useState } from "react";
import {
  type HostAppLike,
  type ModelContextParams,
  type MosaicHostContext,
  type RequestableDisplayMode,
  type SendMessageOptions,
  applyHostFonts,
  applyHostStyleVariables,
  applyMosaicTheme,
  applySafeAreaInsets,
  openLink,
  readAppHostContext,
  readHostContext,
  requestDisplayMode,
  sendMessage,
  subscribeHostContext,
  updateModelContext,
} from "../../../host/host-context.js";

export * from "../../../host/host-context.js";

/** Live host context for an ext-apps `App` (re-renders on `host-context-changed`). */
export function useHostContext(app: HostAppLike | null | undefined): MosaicHostContext {
  const [ctx, setCtx] = useState<MosaicHostContext>(() =>
    app ? readAppHostContext(app) : readHostContext(undefined),
  );
  useEffect(() => {
    if (!app) return undefined;
    setCtx(readAppHostContext(app));
    return subscribeHostContext(app, setCtx);
  }, [app]);
  return ctx;
}

/** Keeps `data-theme` on `root` (default: `<html>`) in step with the host theme. */
export function useMosaicHostTheme(
  app: HostAppLike | null | undefined,
  root?: Element,
): MosaicHostContext {
  const ctx = useHostContext(app);
  useEffect(() => {
    const target = root ?? (typeof document === "undefined" ? undefined : document.documentElement);
    if (target) applyMosaicTheme(ctx.theme, target);
  }, [ctx.theme, root]);
  return ctx;
}

export function useRequestDisplayMode(app: HostAppLike | null | undefined) {
  return useCallback(
    (mode: RequestableDisplayMode) => {
      if (!app) return Promise.reject(new Error("useRequestDisplayMode: no app connected"));
      return requestDisplayMode(app, mode);
    },
    [app],
  );
}

export function useUpdateModelContext(app: HostAppLike | null | undefined) {
  return useCallback(
    (params: ModelContextParams) => {
      if (!app) return Promise.reject(new Error("useUpdateModelContext: no app connected"));
      return updateModelContext(app, params);
    },
    [app],
  );
}

/**
 * One hook for everything the host context styles: `data-theme` (mosaic-tokens dark overrides),
 * safe-area insets as padding + CSS variables (H01), host style variables bridged onto
 * mosaic-tokens and host fonts (H02). Follows `host-context-changed`; cleans up on unmount.
 * `root` defaults to `<html>`.
 */
export function useMosaicHostLayout(
  app: HostAppLike | null | undefined,
  root?: HTMLElement,
): MosaicHostContext {
  const ctx = useHostContext(app);
  useEffect(() => {
    const target = root ?? (typeof document === "undefined" ? undefined : document.documentElement);
    if (!target) return undefined;
    applyMosaicTheme(ctx.theme, target);
    applySafeAreaInsets(ctx.safeAreaInsets, target);
    applyHostStyleVariables(ctx.styles, target);
    return () => {
      applySafeAreaInsets(undefined, target);
      applyHostStyleVariables(undefined, target);
    };
  }, [ctx.theme, ctx.safeAreaInsets, ctx.styles, root]);
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    applyHostFonts(ctx.styles?.fonts, document);
    return () => applyHostFonts(undefined, document);
  }, [ctx.styles?.fonts]);
  return ctx;
}

/** `ui/message` (H04): send a user message; options need `openai/message` (see core). */
export function useSendMessage(app: HostAppLike | null | undefined) {
  return useCallback(
    (text: string, options?: SendMessageOptions) => {
      if (!app) return Promise.reject(new Error("useSendMessage: no app connected"));
      return sendMessage(app, text, options);
    },
    [app],
  );
}

/** `ui/open-link` (H18): ask the host to open an http(s) URL (wallet hand-off, deep links). */
export function useOpenLink(app: HostAppLike | null | undefined) {
  return useCallback(
    (url: string) => {
      if (!app) return Promise.reject(new Error("useOpenLink: no app connected"));
      return openLink(app, url);
    },
    [app],
  );
}
