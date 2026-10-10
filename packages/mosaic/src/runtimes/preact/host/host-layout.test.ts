import { h, render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { useMosaicHostLayout, useOpenLink, useSendMessage } from "./index.js";

// Real preact (h + preact/hooks), no React in the loop.
function fakeApp(ctx: Record<string, unknown>) {
  const app = {
    ctx,
    getHostContext: vi.fn(() => app.ctx),
    requestDisplayMode: vi.fn(),
    updateModelContext: vi.fn(),
    sendMessage: vi.fn(async (_p: unknown) => ({})),
    openLink: vi.fn(async (_p: { url: string }) => ({})),
    onhostcontextchanged: undefined as ((p: Record<string, unknown>) => void) | undefined,
  };
  return app;
}

describe("host layout preact hooks (parity)", () => {
  it("applies theme, safe-area insets and host style variables, and follows changes", async () => {
    const root = document.createElement("div");
    const host = document.createElement("div");
    const app = fakeApp({
      theme: "dark",
      safeAreaInsets: { top: 10, right: 2, bottom: 20, left: 3 },
      styles: { variables: { "--color-background-primary": "rgb(1, 2, 3)" } },
    });
    function View() {
      useMosaicHostLayout(app as never, root);
      return h("span", null, "x");
    }
    await act(() => {
      render(h(View, null), host);
    });
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.style.padding).toBe("10px 2px 20px 3px");
    expect(root.style.getPropertyValue("--mosaic-color-background")).toBe("rgb(1, 2, 3)");
    await act(() => {
      app.onhostcontextchanged?.({ safeAreaInsets: { top: 1, right: 2, bottom: 3, left: 5 } });
    });
    expect(root.style.padding).toBe("1px 2px 3px 5px");
  });

  it("sends a message and opens a link through the app", async () => {
    const app = fakeApp({});
    const host = document.createElement("div");
    let send: ((t: string) => Promise<void>) | undefined;
    let open: ((u: string) => Promise<void>) | undefined;
    function View() {
      send = useSendMessage(app as never);
      open = useOpenLink(app as never);
      return h("span", null, "x");
    }
    await act(() => {
      render(h(View, null), host);
    });
    await send?.("Hello");
    await open?.("https://x.example");
    expect(app.sendMessage).toHaveBeenCalledWith({
      role: "user",
      content: [{ type: "text", text: "Hello" }],
    });
    expect(app.openLink).toHaveBeenCalledWith({ url: "https://x.example/" });
  });
});
