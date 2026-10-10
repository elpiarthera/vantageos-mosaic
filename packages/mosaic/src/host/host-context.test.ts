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
    requestDisplayMode: vi.fn(async ({ mode }: { mode: string }) => ({ mode })),
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

  it("reads hostContext['openai/deepLink'] when present, additive", () => {
    expect(readHostContext({ "openai/deepLink": "https://chatgpt.com/x" }).deepLink).toBe(
      "https://chatgpt.com/x",
    );
    expect(readHostContext({ theme: "dark" }).deepLink).toBeUndefined();
    expect(readHostContext({ "openai/deepLink": 42 }).deepLink).toBeUndefined();
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
    const app = fakeApp({ "openai/deepLink": "https://chatgpt.com/x" });
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

  it("detects ChatGPT from openai/* context keys or the user agent", () => {
    expect(isChatGptHost({ "openai/deepLink": "x" })).toBe(true);
    expect(isChatGptHost({ userAgent: "ChatGPT/1.0" })).toBe(true);
    expect(isChatGptHost({ theme: "dark" })).toBe(false);
    expect(isChatGptHost(undefined)).toBe(false);
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
