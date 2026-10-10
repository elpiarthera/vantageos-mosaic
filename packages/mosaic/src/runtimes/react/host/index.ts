/**
 * @vantageos/mosaic/react/host — React hooks over the framework-agnostic host-context core.
 */
import { useCallback, useEffect, useState } from "react";
import {
  type HostAppLike,
  type ModelContextParams,
  type MosaicHostContext,
  type RequestableDisplayMode,
  applyMosaicTheme,
  readAppHostContext,
  readHostContext,
  requestDisplayMode,
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
