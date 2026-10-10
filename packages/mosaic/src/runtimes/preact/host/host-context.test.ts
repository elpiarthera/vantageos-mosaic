import { h, render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { useHostContext } from "./index.js";

// Real preact (h + preact/hooks), no React in the loop: the parity claim is proven on the
// preact runtime itself, not on a React render.
describe("host-context preact hooks (parity)", () => {
  it("returns the host context and re-renders on change", async () => {
    const app = {
      getHostContext: vi.fn(() => ({ theme: "light" }) as Record<string, unknown>),
      requestDisplayMode: vi.fn(),
      updateModelContext: vi.fn(),
      onhostcontextchanged: undefined as ((p: Record<string, unknown>) => void) | undefined,
    };
    const host = document.createElement("div");
    function View() {
      const c = useHostContext(app as never);
      return h("span", null, c.theme);
    }
    await act(() => {
      render(h(View, null), host);
    });
    expect(host.textContent).toBe("light");
    await act(() => {
      app.onhostcontextchanged?.({ theme: "dark" });
    });
    expect(host.textContent).toBe("dark");
  });
});
