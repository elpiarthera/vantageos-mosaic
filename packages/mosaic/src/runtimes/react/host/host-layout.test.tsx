import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMosaicHostLayout, useOpenLink, useSendMessage } from "./index.js";

type Ctx = Record<string, unknown>;
function fakeApp(ctx: Ctx) {
  const app = {
    ctx,
    getHostContext: vi.fn(() => app.ctx),
    requestDisplayMode: vi.fn(async ({ mode }: { mode: string }) => ({ mode })),
    updateModelContext: vi.fn(async () => ({})),
    sendMessage: vi.fn(async (_p: unknown) => ({})),
    openLink: vi.fn(async (_p: { url: string }) => ({})),
    onhostcontextchanged: undefined as ((p: Ctx) => void) | undefined,
  };
  return app;
}

describe("useMosaicHostLayout (H01 + H02 + theme)", () => {
  it("applies theme, safe-area insets and host style variables to the root, and follows changes", () => {
    const root = document.createElement("div");
    const app = fakeApp({
      theme: "dark",
      safeAreaInsets: { top: 10, right: 2, bottom: 20, left: 3 },
      styles: { variables: { "--color-background-primary": "rgb(1, 2, 3)" } },
    });
    renderHook(() => useMosaicHostLayout(app as never, root));
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.style.padding).toBe("10px 2px 20px 3px");
    expect(root.style.getPropertyValue("--mosaic-color-background")).toBe("rgb(1, 2, 3)");
    act(() =>
      app.onhostcontextchanged?.({ safeAreaInsets: { top: 1, right: 2, bottom: 3, left: 5 } }),
    );
    expect(root.style.padding).toBe("1px 2px 3px 5px");
  });

  it("injects host fonts into the document head and removes them on unmount", () => {
    const root = document.createElement("div");
    const app = fakeApp({ styles: { css: { fonts: "@font-face{font-family:Anthropic}" } } });
    const { unmount } = renderHook(() => useMosaicHostLayout(app as never, root));
    expect(document.head.querySelectorAll("style[data-mosaic-host-fonts]")).toHaveLength(1);
    unmount();
    expect(document.head.querySelectorAll("style[data-mosaic-host-fonts]")).toHaveLength(0);
  });

  it("renders with no app (absent-safe)", () => {
    const root = document.createElement("div");
    const { result } = renderHook(() => useMosaicHostLayout(undefined, root));
    expect(result.current.theme).toBe("light");
    expect(root.style.padding).toBe("");
  });
});

describe("useSendMessage / useOpenLink", () => {
  it("send a ui/message and open a link through the app", async () => {
    const app = fakeApp({});
    const send = renderHook(() => useSendMessage(app as never));
    await send.result.current("Hello");
    expect(app.sendMessage).toHaveBeenCalledWith({
      role: "user",
      content: [{ type: "text", text: "Hello" }],
    });
    const open = renderHook(() => useOpenLink(app as never));
    await open.result.current("https://x.example");
    expect(app.openLink).toHaveBeenCalledWith({ url: "https://x.example" });
  });

  it("reject with no app connected", async () => {
    const send = renderHook(() => useSendMessage(undefined));
    await expect(send.result.current("x")).rejects.toThrow(/no app/);
    const open = renderHook(() => useOpenLink(undefined));
    await expect(open.result.current("https://x.example")).rejects.toThrow(/no app/);
  });
});
