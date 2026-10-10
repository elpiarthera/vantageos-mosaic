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
  /** `hostContext["openai/deepLink"]` when the host (ChatGPT) provides it. */
  deepLink: string | undefined;
  isChatGpt: boolean;
  raw: RawHostContext;
}

export interface ModelContextParams {
  content?: Array<{ type: string; [key: string]: unknown }>;
  structuredContent?: Record<string, unknown>;
}

/** The slice of the ext-apps `App` this layer uses. */
export interface HostAppLike {
  getHostContext(): RawHostContext | undefined;
  requestDisplayMode(params: { mode: HostDisplayMode }): Promise<{ mode: HostDisplayMode }>;
  updateModelContext(params: ModelContextParams): Promise<unknown>;
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
 * ChatGPT host: any `openai/*` key in the host context, or a user agent naming ChatGPT/OpenAI.
 * Read from the context only; `window.openai` is deliberately not consulted (the view must not
 * depend on it).
 */
export function isChatGptHost(raw: unknown): boolean {
  const ctx = asRecord(raw);
  if (Object.keys(ctx).some((k) => k.startsWith("openai/"))) return true;
  const ua = ctx.userAgent;
  return typeof ua === "string" && /chatgpt|openai/i.test(ua);
}

export function readHostContext(raw: unknown): MosaicHostContext {
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
  const deepLink = ctx["openai/deepLink"];
  return {
    theme: mapHostTheme(ctx.theme),
    displayMode,
    availableDisplayModes: available,
    locale: typeof ctx.locale === "string" ? ctx.locale : undefined,
    containerDimensions:
      ctx.containerDimensions && typeof ctx.containerDimensions === "object"
        ? (ctx.containerDimensions as HostContainerDimensions)
        : undefined,
    deepLink: typeof deepLink === "string" ? deepLink : undefined,
    isChatGpt: isChatGptHost(ctx),
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
  if ((mode as string) === "pip" && isChatGptHost(app.getHostContext())) {
    throw new DisplayModeRefusedError(mode);
  }
  return app.requestDisplayMode({ mode });
}

/** `ui/update-model-context`: tell the model what the user is looking at. */
export function updateModelContext(app: HostAppLike, params: ModelContextParams): Promise<unknown> {
  return app.updateModelContext(params);
}

/**
 * Subscribe to host context changes. The ext-apps `onhostcontextchanged` slot holds one handler,
 * so this chains the previous one and restores it on unsubscribe.
 */
export function subscribeHostContext(
  app: HostAppLike,
  listener: (ctx: MosaicHostContext) => void,
): () => void {
  const previous = app.onhostcontextchanged;
  const handler = (params: RawHostContext) => {
    previous?.(params);
    // changed notifications carry a partial context: merge over what the app already holds
    listener(readHostContext({ ...asRecord(app.getHostContext()), ...asRecord(params) }));
  };
  app.onhostcontextchanged = handler;
  return () => {
    if (app.onhostcontextchanged === handler) app.onhostcontextchanged = previous;
  };
}
