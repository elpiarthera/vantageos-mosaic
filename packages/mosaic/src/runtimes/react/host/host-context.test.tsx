import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useHostContext, useMosaicHostTheme, useRequestDisplayMode } from "./index.js";

type Ctx = Record<string, unknown>;
function fakeApp(ctx: Ctx) {
  const app = {
    ctx,
    getHostContext: vi.fn(() => app.ctx),
    requestDisplayMode: vi.fn(async ({ mode }: { mode: string }) => ({ mode })),
    updateModelContext: vi.fn(async () => ({})),
    onhostcontextchanged: undefined as ((p: Ctx) => void) | undefined,
  };
  return app;
}

describe("host-context react hooks", () => {
  it("returns the host context and re-renders on change", () => {
    const app = fakeApp({ theme: "light", locale: "en" });
    const { result } = renderHook(() => useHostContext(app as never));
    expect(result.current.theme).toBe("light");
    act(() => app.onhostcontextchanged?.({ theme: "dark" }));
    expect(result.current.theme).toBe("dark");
    expect(result.current.locale).toBe("en");
  });

  it("renders with no app at all (absent-safe)", () => {
    const { result } = renderHook(() => useHostContext(undefined));
    expect(result.current.theme).toBe("light");
  });

  it("keeps data-theme on the root in step with the host", () => {
    const root = document.createElement("div");
    const app = fakeApp({ theme: "dark" });
    renderHook(() => useMosaicHostTheme(app as never, root));
    expect(root.getAttribute("data-theme")).toBe("dark");
  });

  it("exposes a display mode requester that refuses pip on ChatGPT", async () => {
    const app = fakeApp({ "openai/deepLink": { url: "/x" } });
    const { result } = renderHook(() => useRequestDisplayMode(app as never));
    await expect(result.current("fullscreen")).resolves.toEqual({ mode: "fullscreen" });
    // biome-ignore lint/suspicious/noExplicitAny: proving the runtime refusal past the type
    await expect(result.current("pip" as any)).rejects.toThrow(/pip/);
  });

  it("two components on one app: unmounting one (subscription order) leaves only the mounted one updating", () => {
    const app = fakeApp({ theme: "light" });
    const a = renderHook(() => useHostContext(app as never));
    const b = renderHook(() => useHostContext(app as never));
    a.unmount(); // cleanups run in subscription order: the failing path
    act(() => app.onhostcontextchanged?.({ theme: "dark" }));
    expect(b.result.current.theme).toBe("dark");
    expect(a.result.current.theme).toBe("light"); // frozen at unmount: no stale setState
    b.unmount();
    expect(app.onhostcontextchanged).toBeUndefined();
  });

  it("reports isChatGpt from experimental capabilities through the hook", () => {
    const app = {
      ...fakeApp({ theme: "light" }),
      getHostCapabilities: () => ({ experimental: { "openai/files": {} } }),
    };
    const { result } = renderHook(() => useHostContext(app as never));
    expect(result.current.isChatGpt).toBe(true);
  });
});
