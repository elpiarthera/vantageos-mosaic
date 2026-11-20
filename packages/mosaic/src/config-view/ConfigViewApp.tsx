// i18nKeys: ConfigView.waiting, ConfigView.back

import React, { useSyncExternalStore, useState } from "react";
import { createRoot } from "react-dom/client";
import { ConfigDetail } from "../components/display/ConfigDetail.js";
import type { ListRegistry } from "../components/display/ConfigList.control.js";
import { ConfigList } from "../components/display/ConfigList.js";
import { type MosaicLocale, t } from "../i18n/strings.js";
import { ThemeError, parseThemeDocument, themeToCss } from "../theme/theme.js";
import type { ConfigToolResult, ConfigViewBridge } from "../view-config/view-config.js";
import { createListRegistry, registerListTools } from "./appTools.js";

/** The slice of the ext-apps `App` this shell uses (typed structurally, like the host layer). */
export interface AppLike extends ConfigViewBridge {
  ontoolresult?: unknown;
  ontoolinput?: unknown;
  onhostcontextchanged?: unknown;
  connect(): Promise<unknown>;
  getHostContext(): { locale?: string; theme?: string } | undefined;
}

/** A result shown, with the arguments of the call that produced it (re-sent to page THIS list). */
export interface ViewEntry {
  result: ConfigToolResult;
  args: Record<string, unknown> | undefined;
}

interface ViewState {
  /** Entries shown, oldest first; the last one is on screen. */
  history: ViewEntry[];
  /** Counter bumped per result so a view remounts with fresh state. */
  seq: number;
  toolArgs: Record<string, unknown> | undefined;
  hostLocale: string | undefined;
}

export interface ViewStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): ViewState;
  push(result: ConfigToolResult, args?: Record<string, unknown>): void;
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
    if (next.history)
      applyThemeDocument(state.history[state.history.length - 1]?.result._meta?.theme);
    for (const l of listeners) l();
  };
  app.ontoolresult = (result: ConfigToolResult) =>
    set({ history: [{ result, args: state.toolArgs }], seq: state.seq + 1 });
  // The input may arrive before or after the result: attach it to the first entry when it comes later.
  app.ontoolinput = (params: { arguments?: Record<string, unknown> }) => {
    const [first, ...rest] = state.history;
    set({
      toolArgs: params.arguments,
      ...(first && first.args === undefined
        ? { history: [{ ...first, args: params.arguments }, ...rest] }
        : {}),
    });
  };
  app.onhostcontextchanged = (ctx: { locale?: string; theme?: string }) => {
    applyTheme(ctx.theme);
    if (ctx.locale) set({ hostLocale: ctx.locale });
  };
  return {
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSnapshot: () => state,
    push: (result, args) =>
      set({ history: [...state.history, { result, args }], seq: state.seq + 1 }),
    back: () => set({ history: state.history.slice(0, -1), seq: state.seq + 1 }),
  };
}

/**
 * The host's theme on the document, so the mosaic tokens switch with it (`[data-theme="dark"]`).
 * Only the two values the host contract defines are applied; anything else leaves the document as it is.
 */
export function applyTheme(theme: string | undefined): void {
  if (theme !== "light" && theme !== "dark") return;
  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
}

/**
 * The per-deployment theme of the result on screen: ONE `<style data-mosaic-theme>` in the head,
 * replaced on a new theme, removed when the result carries none. An invalid theme applies nothing
 * (default tokens stay) and is reported on the console naming the bad tokens, never shown raw.
 */
export function applyThemeDocument(theme: unknown): void {
  if (typeof document === "undefined") return;
  const existing = document.head.querySelector("style[data-mosaic-theme]");
  let css = "";
  if (theme !== undefined && theme !== null) {
    try {
      css = themeToCss(parseThemeDocument(theme));
    } catch (e) {
      if (!(e instanceof ThemeError)) throw e;
      console.error(`mosaic config view: theme refused, default tokens kept: ${e.message}`);
    }
  }
  if (css === "") {
    existing?.remove();
    return;
  }
  const el = existing ?? document.createElement("style");
  el.setAttribute("data-mosaic-theme", "");
  el.textContent = css;
  if (!existing) document.head.appendChild(el);
}

function toLocale(tag: string | undefined): MosaicLocale | undefined {
  if (tag === undefined) return undefined;
  return tag.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/**
 * Locale, two orders.
 * Default (`_meta.localeAuthority` absent, "host", or any other value): the host's locale (it knows the
 * person's language), else the one the server echoed in `_meta.locale`, else en. A server that receives no
 * locale from the host echoes its default, so the echo comes second.
 * Opt-in (`_meta.localeAuthority: "server"`): `_meta.locale` ("fr" | "en") wins over the host's. A client
 * deployment holds its staff's language as data, and that staff may read only French while the host UI is
 * English. A missing or invalid `_meta.locale` falls back to the default order, never to a failure.
 */
function resolveLocale(
  result: ConfigToolResult | undefined,
  hostLocale: string | undefined,
): MosaicLocale {
  const echoed = result?._meta?.locale;
  const valid = echoed === "fr" || echoed === "en" ? echoed : undefined;
  if (result?._meta?.localeAuthority === "server" && valid) return valid;
  const host = toLocale(hostLocale);
  if (host) return host;
  return valid ?? "en";
}

/**
 * The single view shell: shows the latest tool result as a List or a Detail, switching on
 * `_meta.viewConfig.kind`. Row actions call other tools through the host bridge and push the
 * returned view; a Back button pops it. No storage, no network, no window access of its own.
 */
export function ConfigViewApp({
  app,
  store: given,
  listRegistry,
}: { app: AppLike; store?: ViewStore; listRegistry?: ListRegistry }) {
  const [store] = useState(() => given ?? createViewStore(app));
  const s = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const entry = s.history[s.history.length - 1];
  const current = entry?.result;
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
          toolArgs={entry?.args}
          bridge={app}
          onResult={store.push}
          {...(listRegistry ? { listRegistry } : {})}
        />
      )}
    </div>
  );
}

/** Entry: bind the notifications, render, then connect. */
export async function startConfigView(app: AppLike, root: HTMLElement): Promise<void> {
  const store = createViewStore(app);
  const listRegistry = createListRegistry();
  registerListTools(app, listRegistry);
  const initialTheme = app.getHostContext()?.theme;
  applyTheme(
    initialTheme ??
      (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"),
  );
  createRoot(root).render(<ConfigViewApp app={app} store={store} listRegistry={listRegistry} />);
  await app.connect();
  // The ext-apps App holds the host context only once the handshake is done, and connect() fires no
  // onhostcontextchanged: the host theme is read again here, so it is not lost to the fallback above.
  const connectedTheme = app.getHostContext()?.theme;
  if (connectedTheme !== undefined) applyTheme(connectedTheme);
}
