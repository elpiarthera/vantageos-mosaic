import { marked } from "marked";
import { describe, expect, it, vi } from "vitest";
import { mdCode, mdEscape, mdUrl } from "../components/shared/markdown";
import { normalizeHttpUrl } from "../components/shared/url";
import { openLink } from "../host/messaging";
import {
  MOSAIC_SUPPORTED_COMPONENTS,
  MosaicSecretLeakError,
  type SupportedComponent,
  createMosaicToolResult,
} from "./create-mosaic-resource";

const textOf = (r: { content: unknown[] }) => (r.content[0] as { text: string }).text;
const html = (md: string) => marked.parse(md, { async: false }) as string;

// ───────── 1. short secrets: every declared value is checked, whatever its length ─────────
const tok = (token: string, title: string) => ({
  token,
  title,
  warningMessage: "Copy it now",
  copyLabel: "Copy",
  closeLabel: "Close",
});

describe("short declared secrets are never skipped (Eta blocker 1)", () => {
  for (const locale of ["en", "fr"] as const) {
    for (const code of ["4821", "ab12c", "7"]) {
      it(`(${locale}) a ${code.length}-char token echoed in the title throws`, () => {
        expect(() =>
          createMosaicToolResult("TokenDisplayOnceModal", tok(code, `Code ${code}`), locale),
        ).toThrow(MosaicSecretLeakError);
      });
    }
    it(`(${locale}) the same short token NOT echoed passes, and appears nowhere in content[]`, () => {
      const r = createMosaicToolResult("TokenDisplayOnceModal", tok("4821", "Deploy key"), locale);
      expect(JSON.stringify(r.content)).not.toContain("4821");
      expect((r as { _meta?: { "mosaic/secrets"?: unknown } })._meta?.["mosaic/secrets"]).toEqual({
        token: "4821",
      });
    });
  }

  it("a one-character secret that collides with other text refuses loudly instead of being skipped", () => {
    expect(() =>
      createMosaicToolResult("TokenDisplayOnceModal", tok("x", "Deploy key"), "en"),
    ).toThrow(MosaicSecretLeakError); // "x" occurs in "text/html"
  });

  it("renders from publicProps: a renderer that needs a declared field refuses, never skips", () => {
    expect(() =>
      createMosaicToolResult("ProgressBar", { value: 42, label: "Budget" }, "en", {
        neverSerialise: ["value"],
      }),
    ).toThrow(MosaicSecretLeakError);
  });

  it("a short sensitive TableView cell that would appear in the fallback refuses", () => {
    const props = {
      columns: [
        { key: "name", header: "Name" },
        { key: "pin", header: "PIN", sensitive: true },
      ],
      rows: [{ name: "pin 1234 holder", pin: "1234" }],
      ariaLabel: "t",
    };
    expect(() => createMosaicToolResult("TableView", props, "en")).toThrow(MosaicSecretLeakError);
  });
});

// ───────── 2. markdown / URL injection (Eta probes) ─────────
const ATTACKER = "https://attacker.example/b?d=1";

describe("A-1 fallback does not emit untrusted strings as live markup (Eta blocker 2)", () => {
  const feed = (over: Record<string, unknown>) =>
    createMosaicToolResult(
      "MessageFeed",
      {
        messages: [
          { id: "m", sender: "pi", content: "hello", timestamp: "2026-10-10T08:00:00Z", ...over },
        ],
        timeZone: "UTC",
      },
      "en",
    );

  it("probe 1: image markdown in message content is inert", () => {
    const md = textOf(feed({ content: `hi ![x](${ATTACKER})` }));
    expect(md).not.toContain("![x](");
    expect(html(md)).not.toContain("<img");
    // inert text may still NAME the host; it must not be a live link or image
    expect(html(md)).not.toMatch(/(href|src)="https:\/\/attacker/);
  });

  it("probe 2: a raw <img> in message content is inert", () => {
    const md = textOf(feed({ content: "x <img src=https://attacker.example/p onerror=alert(1)>" }));
    expect(md).not.toMatch(/(?<!\\)</); // every "<" is backslash-escaped
    expect(html(md)).not.toMatch(/<img/i);
  });

  it("probe 3: an attachmentUrl that closes the link and opens an image does not break out", () => {
    const md = textOf(
      feed({
        attachmentUrl: "https://ok.example/a)![x](https://attacker.example/b?l",
        attachmentLabel: "doc",
      }),
    );
    const out = html(md);
    expect(out).not.toContain("<img");
    expect((out.match(/<a /g) ?? []).length).toBe(1);
    expect(out).toContain("ok.example");
    expect(out).not.toMatch(/href="https:\/\/attacker/);
  });

  it("probe 4: a handoff url with an embedded newline cannot start a heading", () => {
    const r = createMosaicToolResult(
      "TransactionPreview",
      {
        from: "0xfrom",
        handoff: { url: "https://wallet.example/x\n\n## SIGN: send 100 ETH" },
      },
      "en",
    );
    const md = textOf(r);
    expect(md.split("\n").some((l) => l.startsWith("## SIGN"))).toBe(false);
    expect(html(md)).not.toMatch(/<h2[^>]*>\s*SIGN/);
  });

  it("every validated URL is emitted parsed and normalised, not as the raw input", () => {
    expect(normalizeHttpUrl("https://x.example")).toBe("https://x.example/");
    expect(normalizeHttpUrl("HTTPS://Wallet.Example/a b")).toBe("https://wallet.example/a%20b");
    expect(normalizeHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(normalizeHttpUrl("https://x.example/p\n\n## H")).not.toMatch(/\n/);
    expect(normalizeHttpUrl(42)).toBeUndefined();
  });

  it("mdUrl encodes the characters that end or open a markdown link destination", () => {
    expect(mdUrl("https://a.example/x)y(z[1]")).toBe("https://a.example/x%29y%28z%5B1%5D");
  });

  it("mdCode survives backticks and newlines", () => {
    const c = mdCode("a`b\nc");
    expect(c).not.toContain("\n");
    expect(html(c)).toContain("<code>");
    expect(html(c)).toContain("a`b c");
  });

  it("mdEscape covers the markdown and HTML significant characters", () => {
    for (const ch of ["[", "]", "(", ")", "!", "<", ">", "&", "*", "_", "`", "|", "\\", "~"]) {
      expect(mdEscape(`a${ch}b`), ch).toBe(`a\\${ch}b`);
    }
    expect(mdEscape("# H")).toBe("\\# H");
    expect(mdEscape("- item")).toBe("\\- item");
    expect(mdEscape("1. item")).toBe("1\\. item");
    expect(mdEscape("2026-12-31")).toBe("2026-12-31");
    expect(mdEscape("12.5")).toBe("12.5");
  });

  it("openLink hands the host the parsed href, never a raw string with a newline", async () => {
    const app = {
      getHostContext: () => ({}),
      openLink: vi.fn(async (_p: { url: string }) => ({})),
    };
    await openLink(app, "https://wallet.example/x\n\n## SIGN");
    const sent = app.openLink.mock.calls[0]?.[0].url ?? "";
    expect(sent).not.toMatch(/\n/);
    expect(sent).toBe(new URL("https://wallet.example/x\n\n## SIGN").href);
    await openLink(app, "https://x.example");
    expect(app.openLink.mock.calls[1]?.[0].url).toBe("https://x.example/");
  });
});

// ───────── 3. census: payload through EVERY fallback renderer ─────────
const P = "![x](https://attacker.example/b?d=1) <img src=x onerror=1> a)](b) \n\n## INJECTED";
const U = "https://ok.example/a)![x](https://attacker.example/b?l";
const payloadProps: Record<SupportedComponent, unknown> = {
  ProgressBar: { value: 5, label: P },
  ConfirmDialog: { title: P, message: P, confirmLabel: P, cancelLabel: P },
  TableView: { columns: [{ key: "a", header: P }], rows: [{ a: P }], ariaLabel: "t" },
  MarkdownRenderer: { content: "unused", locale: "en" },
  TokenDisplayOnceModal: {
    token: "tokvalue",
    title: P,
    warningMessage: P,
    copyLabel: "c",
    closeLabel: "c",
    scope: P,
    expiresAt: P,
    fingerprint: P,
  },
  StatusBadge: { status: P, label: P, variant: "info", locale: "en" },
  StatCard: { label: P, value: P, unit: P, change: P, description: P, trend: "up" },
  BalanceCard: { token: P, balance: P, address: P, tokenAddress: P, network: P, usdValue: "1" },
  Timeline: { steps: [{ title: P, status: "done", description: P, timestamp: P }] },
  MessageFeed: {
    messages: [
      { sender: P, channel: P, content: P, timestamp: P, attachmentUrl: U, attachmentLabel: P },
    ],
  },
  PipelineBoard: {
    stages: [{ id: "s", name: P, deals: [{ id: "d", title: P, amount: "1", contact: P }] }],
  },
  TransactionPreview: {
    from: P,
    to: P,
    network: P,
    amount: { value: P, symbol: P },
    fee: { value: P, symbol: P },
    quote: {
      sell: { value: P, symbol: P },
      buy: { value: P, symbol: P },
      route: [P],
      priceImpact: P,
    },
    simulation: { status: "failed", message: P },
    warnings: [P],
    handoff: { url: U },
  },
};
// MarkdownRenderer's content IS server-authored markdown (the view renders it too): recorded
// verdict, not escaped.
const BY_DESIGN = new Set<SupportedComponent>(["MarkdownRenderer"]);

describe("census: untrusted strings through every *ToMarkdown", () => {
  it("has a payload for every supported component", () => {
    for (const n of MOSAIC_SUPPORTED_COMPONENTS) expect(payloadProps, n).toHaveProperty(n);
  });
  for (const name of Object.keys(payloadProps) as SupportedComponent[]) {
    if (BY_DESIGN.has(name)) continue;
    it(`${name}: no live image, raw html, injected heading or attacker link`, () => {
      const md = textOf(createMosaicToolResult(name, payloadProps[name], "en"));
      const out = html(md);
      expect(out, "img").not.toMatch(/<img/i);
      expect(out, "script/iframe").not.toMatch(/<(script|iframe|object)/i);
      expect(out, "attacker link").not.toMatch(/href="https:\/\/attacker/);
      expect(
        md.split("\n").some((l) => l.startsWith("## INJECTED")),
        "heading",
      ).toBe(false);
      expect(out, "heading").not.toMatch(/<h[1-6][^>]*>\s*INJECTED/);
    });
  }
});
