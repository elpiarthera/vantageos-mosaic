import { describe, expect, it, vi } from "vitest";
import {
  DisplayModeRefusedError,
  applyMosaicTheme,
  isChatGptHost,
  mapHostTheme,
  readHostContext,
  requestDisplayMode,
  subscribeHostContext,
  updateModelContext,
} from "./host-context.js";

type Ctx = Record<string, unknown>;
function fakeApp(ctx: Ctx | undefined) {
  return {
    getHostContext: vi.fn(() => ctx),
    requestDisplayMode: vi.fn(async ({ mode }: { mode: "inline" | "fullscreen" | "pip" }) => ({
      mode,
    })),
    updateModelContext: vi.fn(async () => ({})),
    onhostcontextchanged: undefined as ((p: Ctx) => void) | undefined,
  };
}

describe("host-context: reading", () => {
  it("reads theme, display mode, locale and container dimensions", () => {
    const c = readHostContext({
      theme: "dark",
      displayMode: "fullscreen",
      availableDisplayModes: ["inline", "fullscreen"],
      locale: "fr-FR",
      containerDimensions: { height: 400, maxWidth: 800 },
    });
    expect(c.theme).toBe("dark");
    expect(c.displayMode).toBe("fullscreen");
    expect(c.availableDisplayModes).toEqual(["inline", "fullscreen"]);
    expect(c.locale).toBe("fr-FR");
    expect(c.containerDimensions).toEqual({ height: 400, maxWidth: 800 });
  });

  it("is absent-safe on undefined / empty context (view works with no host data)", () => {
    for (const raw of [undefined, {}, null]) {
      const c = readHostContext(raw);
      expect(c.theme).toBe("light");
      expect(c.deepLink).toBeUndefined();
      expect(c.displayMode).toBe("inline");
      expect(c.isChatGpt).toBe(false);
    }
  });

  it("reads hostContext['openai/deepLink'] as the spec's { url } object, additive", () => {
    // Spec: openai/mcp-extensions docs/spec.md l.149-210, interface DeepLinkHostState { url: string }
    expect(readHostContext({ "openai/deepLink": { url: "/parts?tag=bolt" } }).deepLink).toEqual({
      url: "/parts?tag=bolt",
    });
    expect(readHostContext({ theme: "dark" }).deepLink).toBeUndefined();
    expect(readHostContext({ "openai/deepLink": "https://x" }).deepLink).toBeUndefined();
    expect(readHostContext({ "openai/deepLink": { url: 42 } }).deepLink).toBeUndefined();
  });
});

describe("host-context: theme mapping onto mosaic-tokens", () => {
  it("maps host themes to light/dark, defaulting to light", () => {
    expect(mapHostTheme("dark")).toBe("dark");
    expect(mapHostTheme("light")).toBe("light");
    expect(mapHostTheme(undefined)).toBe("light");
    expect(mapHostTheme("sepia")).toBe("light");
  });

  it("applies data-theme (the selector mosaic-tokens dark overrides use)", () => {
    const el = document.createElement("div");
    applyMosaicTheme("dark", el);
    expect(el.getAttribute("data-theme")).toBe("dark");
    applyMosaicTheme("light", el);
    expect(el.getAttribute("data-theme")).toBe("light");
  });
});

describe("host-context: display mode request", () => {
  it("requests inline and fullscreen through the app", async () => {
    const app = fakeApp({});
    expect(await requestDisplayMode(app, "fullscreen")).toEqual({ mode: "fullscreen" });
    expect(app.requestDisplayMode).toHaveBeenCalledWith({ mode: "fullscreen" });
    await requestDisplayMode(app, "inline");
    expect(app.requestDisplayMode).toHaveBeenCalledWith({ mode: "inline" });
  });

  it("refuses pip for a ChatGPT host, without calling the host", async () => {
    const app = fakeApp({ "openai/deepLink": { url: "/x" } });
    await expect(
      // biome-ignore lint/suspicious/noExplicitAny: proving the runtime refusal past the type
      requestDisplayMode(app, "pip" as any),
    ).rejects.toBeInstanceOf(DisplayModeRefusedError);
    expect(app.requestDisplayMode).not.toHaveBeenCalled();
  });

  it("types pip out: the compile-time signature admits inline | fullscreen only", () => {
    const app = fakeApp({});
    // @ts-expect-error pip is not a requestable display mode
    void requestDisplayMode(app, "pip");
  });

  it("detects ChatGPT from openai/* host context keys or experimental host capabilities", () => {
    expect(isChatGptHost({ "openai/deepLink": { url: "/x" } })).toBe(true);
    expect(isChatGptHost({ theme: "dark" }, { experimental: { "openai/files": {} } })).toBe(true);
    expect(isChatGptHost({ theme: "dark" })).toBe(false);
    expect(isChatGptHost(undefined)).toBe(false);
  });

  it("does not guess from the user agent (no spec-defined signal)", () => {
    expect(isChatGptHost({ userAgent: "ChatGPT/1.0" })).toBe(false);
  });

  it("refuses pip when only the host capabilities identify ChatGPT", async () => {
    const app = {
      ...fakeApp({}),
      getHostCapabilities: () => ({ experimental: { "openai/message": {} } }),
    };
    await expect(
      // biome-ignore lint/suspicious/noExplicitAny: proving the runtime refusal past the type
      requestDisplayMode(app, "pip" as any),
    ).rejects.toBeInstanceOf(DisplayModeRefusedError);
  });
});

describe("host-context: updateModelContext + subscription", () => {
  it("forwards ui/update-model-context params through the app", async () => {
    const app = fakeApp({});
    const params = { content: [{ type: "text" as const, text: "3 rows selected" }] };
    await updateModelContext(app, params);
    expect(app.updateModelContext).toHaveBeenCalledWith(params);
  });

  it("subscribes to host context changes and unsubscribes restoring the previous handler", () => {
    const app = fakeApp({ theme: "light" });
    const prev = vi.fn();
    app.onhostcontextchanged = prev;
    const seen: string[] = [];
    const off = subscribeHostContext(app, (c) => seen.push(c.theme));
    app.onhostcontextchanged?.({ theme: "dark" });
    expect(seen).toEqual(["dark"]);
    expect(prev).toHaveBeenCalledTimes(1);
    off();
    expect(app.onhostcontextchanged).toBe(prev);
  });
});

describe("host-context: subscription lifecycle (one dispatcher per app)", () => {
  const fire = (app: ReturnType<typeof fakeApp>, ctx: Ctx) => app.onhostcontextchanged?.(ctx);

  for (const order of ["AB", "BA"] as const) {
    it(`unsubscribing in order ${order} leaves no listener and restores the original handler`, () => {
      const app = fakeApp({ theme: "light" });
      const original = vi.fn();
      app.onhostcontextchanged = original;
      const a = vi.fn();
      const b = vi.fn();
      const offs = { A: subscribeHostContext(app, a), B: subscribeHostContext(app, b) };
      fire(app, { theme: "dark" });
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
      expect(original).toHaveBeenCalledTimes(1);
      for (const k of order) {
        offs[k as "A" | "B"]();
        const stillMounted = order.indexOf(k) === 0 ? (k === "A" ? b : a) : null;
        a.mockClear();
        b.mockClear();
        if (stillMounted) {
          fire(app, { theme: "light" });
          // the one just unsubscribed never fires again; the other still does
          expect((k === "A" ? a : b).mock.calls.length).toBe(0);
          expect(stillMounted).toHaveBeenCalledTimes(1);
        }
      }
      a.mockClear();
      b.mockClear();
      original.mockClear();
      expect(app.onhostcontextchanged).toBe(original);
      fire(app, { theme: "dark" });
      expect(a).not.toHaveBeenCalled();
      expect(b).not.toHaveBeenCalled();
      expect(original).toHaveBeenCalledTimes(1);
    });
  }

  it("three subscribers, middle one unsubscribes first: only it stops", () => {
    const app = fakeApp({});
    const [a, b, c] = [vi.fn(), vi.fn(), vi.fn()];
    const offA = subscribeHostContext(app, a);
    const offB = subscribeHostContext(app, b);
    const offC = subscribeHostContext(app, c);
    offB();
    fire(app, { theme: "dark" });
    expect([a, b, c].map((f) => f.mock.calls.length)).toEqual([1, 0, 1]);
    offA();
    offC();
    expect(app.onhostcontextchanged).toBeUndefined();
  });

  it("restores an undefined original slot when the last listener leaves", () => {
    const app = fakeApp({});
    const off = subscribeHostContext(app, vi.fn());
    expect(app.onhostcontextchanged).toBeTypeOf("function");
    off();
    expect(app.onhostcontextchanged).toBeUndefined();
  });

  it("N subscribe/unsubscribe cycles do not grow the chain (original called exactly once)", () => {
    const app = fakeApp({});
    const original = vi.fn();
    app.onhostcontextchanged = original;
    const live = vi.fn();
    const offLive = subscribeHostContext(app, live);
    for (let i = 0; i < 50; i++) subscribeHostContext(app, vi.fn())();
    fire(app, { theme: "dark" });
    expect(original).toHaveBeenCalledTimes(1);
    expect(live).toHaveBeenCalledTimes(1);
    offLive();
    expect(app.onhostcontextchanged).toBe(original);
  });

  it("an unsubscribe is idempotent", () => {
    const app = fakeApp({});
    const a = vi.fn();
    const offA = subscribeHostContext(app, a);
    const offB = subscribeHostContext(app, vi.fn());
    offA();
    offA();
    fire(app, {});
    expect(a).not.toHaveBeenCalled();
    offB();
    expect(app.onhostcontextchanged).toBeUndefined();
  });

  it("listeners see the capability signal through the same detection as requestDisplayMode", () => {
    const app = {
      ...fakeApp({}),
      getHostCapabilities: () => ({ experimental: { "openai/files": {} } }),
    };
    const seen: boolean[] = [];
    subscribeHostContext(app, (c) => seen.push(c.isChatGpt));
    app.onhostcontextchanged?.({ theme: "dark" });
    expect(seen).toEqual([true]);
  });
});

describe("host-context: readHostContext capabilities", () => {
  it("sets isChatGpt from experimental openai/* capabilities, like isChatGptHost", () => {
    const caps = { experimental: { "openai/files": {} } };
    expect(readHostContext({ theme: "dark" }, caps).isChatGpt).toBe(true);
    expect(readHostContext({ theme: "dark" }).isChatGpt).toBe(false);
    expect(readHostContext({ theme: "dark" }, { experimental: {} }).isChatGpt).toBe(false);
    expect(readHostContext({ theme: "dark" }, undefined).isChatGpt).toBe(false);
  });
});
