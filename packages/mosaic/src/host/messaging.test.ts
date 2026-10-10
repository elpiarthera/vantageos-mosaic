import { describe, expect, it, vi } from "vitest";
import { HostRequestError, openLink, sendMessage } from "./messaging.js";

// Spec: MCP Apps 2026-01-26 ext-apps-spec.mdx
//   l.965-995  ui/open-link   params { url: string }; empty result; error -32000 with
//              "Link opening denied by user" | "Invalid URL" | "Policy violation"
//   l.998-1030 ui/message     params { role: "user", content }; error -32000
//              "Message sending denied" | "Invalid message format"
//   ext-apps 1.7.3 spec.types.d.ts McpUiMessageRequest: content: ContentBlock[] (an array)
// OpenAI extension (openai-mcp-ext-spec.md l.1100-1235):
//   capability hostCapabilities.experimental["openai/message"]: {}  (l.1106)
//   params._meta["openai/message"] = { target?: "active"|"new", send?: boolean } (l.1153-1170)
//   defaults { target: "active", send: true } (l.1147); iOS/Android: only the defaults (l.1148)
function app(over: Record<string, unknown> = {}) {
  return {
    getHostContext: vi.fn(() => ({}) as Record<string, unknown>),
    getHostCapabilities: vi.fn(() => ({}) as { experimental?: Record<string, unknown> }),
    sendMessage: vi.fn(async (_p: unknown) => ({})),
    openLink: vi.fn(async (_p: { url: string }) => ({})),
    ...over,
  };
}

describe("ui/message helper (H04)", () => {
  it("sends a user text block as a content array, with no _meta when no option is given", async () => {
    const a = app();
    await sendMessage(a, "Show me the overdue tasks");
    expect(a.sendMessage).toHaveBeenCalledWith({
      role: "user",
      content: [{ type: "text", text: "Show me the overdue tasks" }],
    });
  });

  it("adds _meta['openai/message'] only when the host advertises openai/message", async () => {
    const a = app({
      getHostCapabilities: vi.fn(() => ({ experimental: { "openai/message": {} } })),
    });
    await sendMessage(a, "Draft this", { target: "new", send: false });
    expect(a.sendMessage).toHaveBeenCalledWith({
      role: "user",
      content: [{ type: "text", text: "Draft this" }],
      _meta: { "openai/message": { target: "new", send: false } },
    });
  });

  it("refuses non-default options on a host without openai/message instead of silently sending", async () => {
    const a = app();
    await expect(sendMessage(a, "x", { send: false })).rejects.toBeInstanceOf(HostRequestError);
    expect(a.sendMessage).not.toHaveBeenCalled();
  });

  it("allows the default options everywhere (target active, send true)", async () => {
    const a = app();
    await sendMessage(a, "x", { target: "active", send: true });
    expect(a.sendMessage).toHaveBeenCalledTimes(1);
    const sent = a.sendMessage.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sent._meta).toBeUndefined();
  });

  it("refuses non-default options on a mobile platform even with openai/message", async () => {
    const a = app({
      getHostContext: vi.fn(() => ({ platform: "mobile" })),
      getHostCapabilities: vi.fn(() => ({ experimental: { "openai/message": {} } })),
    });
    await expect(sendMessage(a, "x", { target: "new" })).rejects.toBeInstanceOf(HostRequestError);
    expect(a.sendMessage).not.toHaveBeenCalled();
  });

  it("rejects empty text and an app without sendMessage", async () => {
    await expect(sendMessage(app(), "   ")).rejects.toBeInstanceOf(HostRequestError);
    await expect(sendMessage(app({ sendMessage: undefined }), "x")).rejects.toBeInstanceOf(
      HostRequestError,
    );
  });

  it("surfaces a host rejection (isError) as a HostRequestError", async () => {
    const a = app({ sendMessage: vi.fn(async () => ({ isError: true })) });
    await expect(sendMessage(a, "x")).rejects.toMatchObject({ method: "ui/message" });
  });
});

describe("ui/open-link helper (H18)", () => {
  it("opens an https URL through the app", async () => {
    const a = app();
    await openLink(a, "https://wallet.example.com/swap?id=1");
    expect(a.openLink).toHaveBeenCalledWith({ url: "https://wallet.example.com/swap?id=1" });
  });

  it("refuses non-http(s) and malformed URLs before calling the host", async () => {
    const a = app();
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "/relative", "not a url", ""]) {
      await expect(openLink(a, bad)).rejects.toBeInstanceOf(HostRequestError);
    }
    expect(a.openLink).not.toHaveBeenCalled();
  });

  it("surfaces the host's denial reason (spec error message) instead of swallowing it", async () => {
    const a = app({
      openLink: vi.fn(async () => {
        throw Object.assign(new Error("Link opening denied by user"), { code: -32000 });
      }),
    });
    await expect(openLink(a, "https://x.example")).rejects.toMatchObject({
      method: "ui/open-link",
      reason: "Link opening denied by user",
    });
  });

  it("surfaces a result-level isError and an app without openLink", async () => {
    await expect(
      openLink(app({ openLink: vi.fn(async () => ({ isError: true })) }), "https://x.example"),
    ).rejects.toMatchObject({ method: "ui/open-link" });
    await expect(
      openLink(app({ openLink: undefined }), "https://x.example"),
    ).rejects.toBeInstanceOf(HostRequestError);
  });
});
