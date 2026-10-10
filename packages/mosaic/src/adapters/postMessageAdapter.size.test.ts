import { describe, expect, it, vi } from "vitest";
import { SIZE_CHANGED_METHOD, postSizeChanged, startSizeReporting } from "./postMessageAdapter";

// Spec: MCP Apps 2026-01-26 ext-apps-spec.mdx
//   l.1204-1215 `ui/notifications/size-changed`, params { width: number, height: number };
//               "The View SHOULD send this notification when rendered content body size changes
//               (e.g. using ResizeObserver API to report up to date size)."
//   l.718       hosts MUST listen for it and resize the iframe (flexible dimensions).
//   l.733       the ext-apps SDK does this itself (autoResize); this covers the raw adapter.
class FakeResizeObserver {
  static last: FakeResizeObserver | undefined;
  disconnected = false;
  observed: unknown[] = [];
  constructor(public cb: () => void) {
    FakeResizeObserver.last = this;
  }
  observe(el: unknown) {
    this.observed.push(el);
  }
  disconnect() {
    this.disconnected = true;
  }
}

function target(size: { width: number; height: number }) {
  return {
    getBoundingClientRect: () => ({ width: size.width, height: size.height }),
    scrollHeight: size.height,
    scrollWidth: size.width,
  } as unknown as Element;
}

describe("size-changed reporting from the raw adapter (H15)", () => {
  it("posts a JSON-RPC notification with { width, height } to the parent window", () => {
    const parent = { postMessage: vi.fn() };
    postSizeChanged({ width: 320, height: 480 }, parent as unknown as Window);
    expect(parent.postMessage).toHaveBeenCalledWith(
      { jsonrpc: "2.0", method: SIZE_CHANGED_METHOD, params: { width: 320, height: 480 } },
      "*",
    );
    expect(SIZE_CHANGED_METHOD).toBe("ui/notifications/size-changed");
  });

  it("sends the initial size, then one notification per CHANGED size, rounded up", () => {
    const sent: Array<{ width: number; height: number }> = [];
    const size = { width: 300.2, height: 100.4 };
    const stop = startSizeReporting({
      element: target(size),
      send: (s) => sent.push(s),
      ResizeObserverImpl: FakeResizeObserver as unknown as typeof ResizeObserver,
    });
    expect(sent).toEqual([{ width: 301, height: 101 }]);
    FakeResizeObserver.last?.cb(); // same size: deduplicated
    expect(sent).toHaveLength(1);
    size.height = 250;
    FakeResizeObserver.last?.cb();
    expect(sent.at(-1)).toEqual({ width: 301, height: 250 });
    expect(sent).toHaveLength(2);
    stop();
    expect(FakeResizeObserver.last?.disconnected).toBe(true);
  });

  it("observes the element it was given", () => {
    const el = target({ width: 1, height: 1 });
    startSizeReporting({
      element: el,
      send: () => {},
      ResizeObserverImpl: FakeResizeObserver as unknown as typeof ResizeObserver,
    });
    expect(FakeResizeObserver.last?.observed).toEqual([el]);
  });

  it("fails loudly when no ResizeObserver exists instead of silently never reporting", () => {
    expect(() =>
      startSizeReporting({
        element: target({ width: 1, height: 1 }),
        send: () => {},
        ResizeObserverImpl: null,
      }),
    ).toThrow(/ResizeObserver/);
  });
});
