/**
 * Host-context layer — framework-agnostic core.
 *
 * Reads the MCP Apps host context (spec 2026-01-26, `ui/notifications/host-context-changed`)
 * through the `@modelcontextprotocol/ext-apps` `App` API, and layers the OpenAI Apps SDK
 * additions on top, strictly additive: a view works with no `openai/*` key at all.
 *
 * The `App` is typed STRUCTURALLY (`HostAppLike`): this module imports nothing at runtime, so
 * mosaic takes no dependency on ext-apps and any `App` instance satisfies the shape. No DOM
 * access happens at import time; `applyMosaicTheme` takes the target element explicitly.
 */

/** Display modes the MCP Apps spec defines. */
export type HostDisplayMode = "inline" | "fullscreen" | "pip";
/** Display modes a mosaic view may request. `pip` is typed out: it is never requested. */
export type RequestableDisplayMode = "inline" | "fullscreen";
/** The two themes mosaic-tokens styles (`[data-theme="dark"]` overrides the light `:root`). */
export type MosaicTheme = "light" | "dark";

export type HostContainerDimensions = {
  height?: number;
  maxHeight?: number;
  width?: number;
  maxWidth?: number;
};

/** Raw host context: the spec's open `[key: string]: unknown` record. */
export type RawHostContext = Record<string, unknown>;

export interface MosaicHostContext {
  theme: MosaicTheme;
  displayMode: HostDisplayMode;
  availableDisplayModes: HostDisplayMode[];
  locale: string | undefined;
  containerDimensions: HostContainerDimensions | undefined;
  /**
   * `hostContext["openai/deepLink"]` when the host provides it: `{ url }`, an app-relative URL
   * (openai/mcp-extensions docs/spec.md l.149-210, `DeepLinkHostState`).
   */
  deepLink: { url: string } | undefined;
  isChatGpt: boolean;
  raw: RawHostContext;
}

export interface ModelContextParams {
  content?: Array<{ type: string; [key: string]: unknown }>;
  structuredContent?: Record<string, unknown>;
}

export type HostCapabilitiesLike = { experimental?: Record<string, unknown> };

/** The slice of the ext-apps `App` this layer uses. */
export interface HostAppLike {
  getHostContext(): RawHostContext | undefined;
  requestDisplayMode(params: { mode: HostDisplayMode }): Promise<{ mode: HostDisplayMode }>;
  updateModelContext(params: ModelContextParams): Promise<unknown>;
  getHostCapabilities?(): HostCapabilitiesLike | undefined;
  onhostcontextchanged?: ((params: RawHostContext) => void) | undefined;
}

/** Thrown when a display mode is requested that mosaic refuses for the current host. */
export class DisplayModeRefusedError extends Error {
  readonly mode: string;
  constructor(mode: string) {
    super(`Display mode "${mode}" is refused for a ChatGPT host (inline | fullscreen only).`);
    this.name = "DisplayModeRefusedError";
    this.mode = mode;
  }
}

const DISPLAY_MODES: readonly HostDisplayMode[] = ["inline", "fullscreen", "pip"];

function asRecord(raw: unknown): RawHostContext {
  return raw !== null && typeof raw === "object" ? (raw as RawHostContext) : {};
}

/** host theme -> mosaic-tokens theme. Anything that is not "dark" renders light. */
export function mapHostTheme(theme: unknown): MosaicTheme {
  return theme === "dark" ? "dark" : "light";
}

/**
 * ChatGPT host detection.
 *
 * DECLARED DIVERGENCE: the OpenAI spec defines no host-identification value (`hostInfo.name` is
 * free-form, e.g. "example-host"), so there is no spec signal to read. The best available
 * evidence is the vendor namespace the spec reserves for ChatGPT: any `openai/*` key in the
 * host context (e.g. `openai/deepLink`, `openai/modelContext`) or in
 * `hostCapabilities.experimental` (e.g. `openai/files`, `openai/message`). No user-agent
 * sniffing. A ChatGPT host that sends neither is not detected; `pip` is typed out regardless,
 * so the runtime refusal is a second line, not the only one.
 */
export function isChatGptHost(raw: unknown, capabilities?: HostCapabilitiesLike | null): boolean {
  const inNamespace = (o: object | undefined) =>
    o !== undefined && Object.keys(o).some((k) => k.startsWith("openai/"));
  return inNamespace(asRecord(raw)) || inNamespace(capabilities?.experimental);
}

export function readHostContext(
  raw: unknown,
  capabilities?: HostCapabilitiesLike | null,
): MosaicHostContext {
  const ctx = asRecord(raw);
  const mode = ctx.displayMode;
  const displayMode: HostDisplayMode = DISPLAY_MODES.includes(mode as HostDisplayMode)
    ? (mode as HostDisplayMode)
    : "inline";
  const available = Array.isArray(ctx.availableDisplayModes)
    ? (ctx.availableDisplayModes.filter((m) =>
        DISPLAY_MODES.includes(m as HostDisplayMode),
      ) as HostDisplayMode[])
    : [];
  const rawLink = ctx["openai/deepLink"];
  const linkUrl = asRecord(rawLink).url;
  return {
    theme: mapHostTheme(ctx.theme),
    displayMode,
    availableDisplayModes: available,
    locale: typeof ctx.locale === "string" ? ctx.locale : undefined,
    containerDimensions:
      ctx.containerDimensions && typeof ctx.containerDimensions === "object"
        ? (ctx.containerDimensions as HostContainerDimensions)
        : undefined,
    deepLink: typeof linkUrl === "string" ? { url: linkUrl } : undefined,
    isChatGpt: isChatGptHost(ctx, capabilities),
    raw: ctx,
  };
}

/** Sets `data-theme` on `root`: the attribute mosaic-tokens' dark overrides key on. */
export function applyMosaicTheme(theme: MosaicTheme, root: Element): void {
  root.setAttribute("data-theme", theme);
}

/**
 * Request a display mode. `pip` is excluded by the type and refused at runtime for a ChatGPT
 * host (a caller that casts past the type still cannot reach the host with it).
 */
export async function requestDisplayMode(
  app: HostAppLike,
  mode: RequestableDisplayMode,
): Promise<{ mode: HostDisplayMode }> {
  if (
    (mode as string) === "pip" &&
    isChatGptHost(app.getHostContext(), app.getHostCapabilities?.())
  ) {
    throw new DisplayModeRefusedError(mode);
  }
  return app.requestDisplayMode({ mode });
}

/** `ui/update-model-context`: tell the model what the user is looking at. */
export function updateModelContext(app: HostAppLike, params: ModelContextParams): Promise<unknown> {
  return app.updateModelContext(params);
}

/** Read the live context of an app, with the same ChatGPT detection `requestDisplayMode` uses. */
export function readAppHostContext(app: HostAppLike): MosaicHostContext {
  return readHostContext(app.getHostContext(), app.getHostCapabilities?.());
}

interface Dispatcher {
  /** The handler that was in the slot before the first subscriber. */
  previous: HostAppLike["onhostcontextchanged"];
  listeners: Set<(ctx: MosaicHostContext) => void>;
  handler: (params: RawHostContext) => void;
}

// One dispatcher per app: the ext-apps `onhostcontextchanged` slot holds a single handler, so
// subscribers must not chain through it (unsubscribing out of order would reinstall a dead
// listener). The dispatcher is installed on the first subscribe and removed on the last
// unsubscribe, restoring whatever handler the slot held before.
const dispatchers = new WeakMap<HostAppLike, Dispatcher>();

/**
 * Subscribe to host context changes. Any number of subscribers, unsubscribed in any order.
 * Notifications carry a partial context, merged over what the app already holds.
 */
export function subscribeHostContext(
  app: HostAppLike,
  listener: (ctx: MosaicHostContext) => void,
): () => void {
  let d = dispatchers.get(app);
  if (!d) {
    const created: Dispatcher = {
      previous: app.onhostcontextchanged,
      listeners: new Set(),
      handler: (params) => {
        created.previous?.(params);
        const ctx = readHostContext(
          { ...asRecord(app.getHostContext()), ...asRecord(params) },
          app.getHostCapabilities?.(),
        );
        for (const l of [...created.listeners]) l(ctx);
      },
    };
    d = created;
    dispatchers.set(app, d);
    app.onhostcontextchanged = d.handler;
  }
  const active = d;
  // a fresh wrapper per subscription keeps two subscriptions of the same function distinct
  const entry = (ctx: MosaicHostContext) => listener(ctx);
  active.listeners.add(entry);
  return () => {
    if (!active.listeners.delete(entry)) return; // idempotent
    if (active.listeners.size === 0) {
      if (app.onhostcontextchanged === active.handler) app.onhostcontextchanged = active.previous;
      dispatchers.delete(app);
    }
  };
}
