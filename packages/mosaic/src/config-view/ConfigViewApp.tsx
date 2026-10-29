// i18nKeys: ConfigView.waiting, ConfigView.back

import React, { useSyncExternalStore, useState } from "react";
import { createRoot } from "react-dom/client";
import { ConfigDetail } from "../components/display/ConfigDetail.js";
import { ConfigList } from "../components/display/ConfigList.js";
import { type MosaicLocale, t } from "../i18n/strings.js";
import type { ConfigToolResult, ConfigViewBridge } from "../view-config/view-config.js";

/** The slice of the ext-apps `App` this shell uses (typed structurally, like the host layer). */
export interface AppLike extends ConfigViewBridge {
  ontoolresult?: unknown;
  ontoolinput?: unknown;
  onhostcontextchanged?: unknown;
  connect(): Promise<unknown>;
  getHostContext(): { locale?: string } | undefined;
}

interface ViewState {
  /** Results shown, oldest first; the last one is on screen. */
  history: ConfigToolResult[];
  /** Counter bumped per result so a view remounts with fresh state. */
  seq: number;
  toolArgs: Record<string, unknown> | undefined;
  hostLocale: string | undefined;
}

export interface ViewStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): ViewState;
  push(result: ConfigToolResult): void;
  back(): void;
}

/**
 * Registers the host notifications SYNCHRONOUSLY, at creation, so `ontoolresult` is in place
 * before `connect()` (the first view renders from the initial tool result, no second call).
 */
export function createViewStore(app: AppLike): ViewStore {
  let state: ViewState = { history: [], seq: 0, toolArgs: undefined, hostLocale: undefined };
  const listeners = new Set<() => void>();
  const set = (next: Partial<ViewState>) => {
    state = { ...state, ...next };
    for (const l of listeners) l();
  };
  app.ontoolresult = (result: ConfigToolResult) => set({ history: [result], seq: state.seq + 1 });
  app.ontoolinput = (params: { arguments?: Record<string, unknown> }) =>
    set({ toolArgs: params.arguments });
  app.onhostcontextchanged = (ctx: { locale?: string }) => {
    if (ctx.locale) set({ hostLocale: ctx.locale });
  };
  return {
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSnapshot: () => state,
    push: (result) => set({ history: [...state.history, result], seq: state.seq + 1 }),
    back: () => set({ history: state.history.slice(0, -1), seq: state.seq + 1 }),
  };
}

function toLocale(tag: string | undefined): MosaicLocale | undefined {
  if (tag === undefined) return undefined;
  return tag.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/** Locale: the one the server echoed in `_meta`, else the host's, else en. */
function resolveLocale(
  result: ConfigToolResult | undefined,
  hostLocale: string | undefined,
): MosaicLocale {
  const echoed = result?._meta?.locale;
  if (echoed === "fr" || echoed === "en") return echoed;
  return toLocale(hostLocale) ?? "en";
}

/**
 * The single view shell: shows the latest tool result as a List or a Detail, switching on
 * `_meta.viewConfig.kind`. Row actions call other tools through the host bridge and push the
 * returned view; a Back button pops it. No storage, no network, no window access of its own.
 */
export function ConfigViewApp({ app, store: given }: { app: AppLike; store?: ViewStore }) {
  const [store] = useState(() => given ?? createViewStore(app));
  const s = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const current = s.history[s.history.length - 1];
  const locale = resolveLocale(current, s.hostLocale ?? app.getHostContext()?.locale);

  if (!current) return <output>{t("ConfigView.waiting", locale)}</output>;
  const viewConfig = current._meta?.viewConfig;
  const kind = (viewConfig as { kind?: unknown } | undefined)?.kind;
  return (
    <div>
      {s.history.length > 1 ? (
        <button type="button" className="mosaic-action" onClick={store.back}>
          {t("ConfigView.back", locale)}
        </button>
      ) : null}
      {kind === "detail" ? (
        <ConfigDetail
          key={s.seq}
          config={viewConfig}
          payload={current.structuredContent}
          locale={locale}
          bridge={app}
          onResult={store.push}
        />
      ) : (
        <ConfigList
          key={s.seq}
          config={viewConfig}
          payload={current.structuredContent}
          locale={locale}
          toolArgs={s.history.length === 1 ? s.toolArgs : undefined}
          bridge={app}
          onResult={store.push}
        />
      )}
    </div>
  );
}

/** Entry: bind the notifications, render, then connect. */
export async function startConfigView(app: AppLike, root: HTMLElement): Promise<void> {
  const store = createViewStore(app);
  createRoot(root).render(<ConfigViewApp app={app} store={store} />);
  await app.connect();
}
