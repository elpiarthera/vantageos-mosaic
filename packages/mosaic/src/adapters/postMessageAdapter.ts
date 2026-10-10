import { type Observable, Subject } from "rxjs";

/**
 * MCP App postMessage adapter (mosaic-architecture-standard-v1 §3.4 streaming).
 * Listens for `mosaic.stream.chunk` messages and emits their `data` payload
 * into an RxJS Observable so components can consume them via {@link useStreamingHydration}.
 *
 * Canonical envelope per StreamChunkSchema:
 *   { type: 'mosaic.stream.chunk', componentKey, chunkId, data, isLast }
 */
export const MOSAIC_STREAM_CHUNK_TYPE = "mosaic.stream.chunk" as const;

export function createPostMessageObservable<T>(): Observable<Partial<T>> {
  const subject = new Subject<Partial<T>>();
  if (typeof window !== "undefined") {
    window.addEventListener("message", (event: MessageEvent) => {
      const data = event.data as { type?: string; data?: unknown; params?: unknown } | undefined;
      if (data?.type === MOSAIC_STREAM_CHUNK_TYPE) {
        subject.next((data.data ?? data.params) as Partial<T>);
      }
    });
  }
  return subject.asObservable();
}

/**
 * Size reporting for views that talk to the host through this raw adapter instead of the
 * ext-apps `App` (whose `autoResize` does the same, ext-apps-spec.mdx l.733).
 *
 * Spec: MCP Apps 2026-01-26 ext-apps-spec.mdx l.1204-1215, `ui/notifications/size-changed`
 * with params `{ width: number, height: number }`; "The View SHOULD send this notification when
 * rendered content body size changes (e.g. using ResizeObserver API)". Hosts MUST resize the
 * iframe on it when dimensions are flexible (l.718), which Claude's inline "height auto-fits to
 * content" rule relies on.
 */
export const SIZE_CHANGED_METHOD = "ui/notifications/size-changed" as const;

export interface ReportedSize {
  width: number;
  height: number;
}

/** Posts the JSON-RPC notification to the host (the parent window by default). */
export function postSizeChanged(size: ReportedSize, target: Window = window.parent): void {
  target.postMessage(
    {
      jsonrpc: "2.0",
      method: SIZE_CHANGED_METHOD,
      params: { width: size.width, height: size.height },
    },
    "*",
  );
}

export interface SizeReportingOptions {
  /** Element whose rendered size is reported. Default: `document.documentElement`. */
  element?: Element;
  /** Default: {@link postSizeChanged} to `window.parent`. */
  send?: (size: ReportedSize) => void;
  /** Injection point; `null` simulates an environment with none. Default: the global. */
  ResizeObserverImpl?: typeof ResizeObserver | null;
}

/**
 * Sends the current size now, then again whenever it changes (consecutive identical sizes are
 * not re-sent). Returns the stop function. Throws when there is no ResizeObserver: a view that
 * silently never reports its height renders clipped in the host.
 */
export function startSizeReporting(options: SizeReportingOptions = {}): () => void {
  const RO =
    options.ResizeObserverImpl === undefined
      ? typeof ResizeObserver === "undefined"
        ? null
        : ResizeObserver
      : options.ResizeObserverImpl;
  if (RO === null) throw new Error("startSizeReporting: ResizeObserver is unavailable");
  const element = options.element ?? document.documentElement;
  const send = options.send ?? ((s: ReportedSize) => postSizeChanged(s));
  let last: ReportedSize | undefined;
  const report = () => {
    const rect = element.getBoundingClientRect();
    const size = {
      width: Math.ceil(rect.width),
      height: Math.ceil(Math.max(rect.height, (element as HTMLElement).scrollHeight ?? 0)),
    };
    if (last && last.width === size.width && last.height === size.height) return;
    last = size;
    send(size);
  };
  const observer = new RO(report);
  observer.observe(element);
  report();
  return () => observer.disconnect();
}
