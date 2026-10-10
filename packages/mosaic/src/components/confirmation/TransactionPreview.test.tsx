import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransactionPreview } from "./TransactionPreview";
import { transactionPreviewToMarkdown } from "./TransactionPreview.markdown";
import { TransactionPreviewPropsSchema } from "./TransactionPreview.schema";

afterEach(cleanup);

// R11 (prepare-only) / R12 (refused): the Fuse server never signs. Study (artifact KowNyf, step 2):
// "Prepared transactions that the server never signs... simulates them and shows a preview";
// OpenAI's public directory prohibits executing crypto transfers. Shapes follow fuse-mcp-server
// getTradeQuote.ts ("expected output amount, route, and price impact. Read-only").
const transfer = {
  kind: "transfer" as const,
  network: "Fuse",
  from: "0x1111111111111111111111111111111111111111",
  to: "0x2222222222222222222222222222222222222222",
  amount: { value: "12.5", symbol: "FUSE" },
  fee: { value: "0.0021", symbol: "FUSE" },
  simulation: { status: "success" as const },
};
const swap = {
  kind: "swap" as const,
  network: "Fuse",
  testnet: true,
  from: transfer.from,
  quote: {
    sell: { value: "100", symbol: "USDC" },
    buy: { value: "99.2", symbol: "FUSE" },
    minReceived: { value: "98.9", symbol: "FUSE" },
    route: ["USDC", "WFUSE", "FUSE"],
    priceImpact: "1.35",
  },
  fee: { value: "0.01", symbol: "FUSE" },
  simulation: { status: "failed" as const, message: "Slippage too tight" },
  warnings: ["Quote is volatile", "Low liquidity"],
  expiresAt: "2026-10-10T12:00:00Z",
  handoff: { url: "https://wallet.example/swap?q=1" },
};

describe("TransactionPreview (R11)", () => {
  it("states prominently that the transaction is NOT SIGNED", () => {
    render(<TransactionPreview {...transfer} />);
    expect(screen.queryAllByText("NOT SIGNED - preparation only")).toHaveLength(1);
  });

  it("shows a transfer: network, from, to, amount, fee, simulation", () => {
    render(<TransactionPreview {...transfer} />);
    expect(screen.queryAllByText(transfer.from)).toHaveLength(1);
    expect(screen.queryAllByText(transfer.to)).toHaveLength(1);
    expect(screen.queryAllByText("12.5 FUSE")).toHaveLength(1);
    expect(screen.queryAllByText("0.0021 FUSE")).toHaveLength(1);
    expect(screen.queryAllByText("Simulation succeeded")).toHaveLength(1);
    expect(screen.queryAllByText("Fuse")).toHaveLength(1);
  });

  it("shows the swap-quote variant: sell, buy, minimum, route, price impact, expiry", () => {
    render(<TransactionPreview {...swap} timeZone="UTC" />);
    expect(screen.queryAllByText("100 USDC")).toHaveLength(1);
    expect(screen.queryAllByText("99.2 FUSE")).toHaveLength(1);
    expect(screen.queryAllByText("98.9 FUSE")).toHaveLength(1);
    expect(screen.queryAllByText("USDC > WFUSE > FUSE")).toHaveLength(1);
    expect(screen.queryAllByText(/1\.35%/)).toHaveLength(1);
    expect(screen.queryAllByText("High price impact")).toHaveLength(1);
    expect(screen.queryAllByText(/Oct 10, 2026/)).toHaveLength(1);
    expect(screen.queryAllByText("Testnet")).toHaveLength(1);
  });

  it("flags a failed simulation with its message and lists the warnings", () => {
    render(<TransactionPreview {...swap} />);
    expect(screen.queryAllByText("Simulation failed")).toHaveLength(1);
    expect(screen.queryAllByText("Slippage too tight")).toHaveLength(1);
    expect(screen.queryAllByText("Quote is volatile")).toHaveLength(1);
    expect(screen.queryAllByText("Low liquidity")).toHaveLength(1);
  });

  it("does not flag price impact below 1%", () => {
    render(<TransactionPreview {...swap} quote={{ ...swap.quote, priceImpact: "0.42" }} />);
    expect(screen.queryAllByText("High price impact")).toHaveLength(0);
  });

  it("offers a single wallet handoff, through onHandoff when given (host ui/open-link)", () => {
    const onHandoff = vi.fn();
    render(<TransactionPreview {...swap} onHandoff={onHandoff} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0] as HTMLElement);
    expect(onHandoff).toHaveBeenCalledWith("https://wallet.example/swap?q=1");
  });

  it("falls back to a plain link without onHandoff, and drops a non-http(s) handoff", () => {
    render(<TransactionPreview {...swap} />);
    const link = screen.getAllByRole("link", { name: "Open in wallet" });
    expect(link).toHaveLength(1);
    expect(link[0]?.getAttribute("rel")).toBe("noopener noreferrer");
    cleanup();
    render(<TransactionPreview {...swap} handoff={{ url: "javascript:alert(1)" }} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("Skeleton while loading, empty state for {}, alert on invalid props, FR", () => {
    const a = render(<TransactionPreview {...transfer} loading />);
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    a.unmount();
    const b = render(<TransactionPreview />);
    expect(screen.queryAllByText("No transaction to preview")).toHaveLength(1);
    b.unmount();
    const c = render(<TransactionPreview {...transfer} locale="fr" />);
    expect(screen.queryAllByText("NON SIGNÉ - préparation uniquement")).toHaveLength(1);
    c.unmount();
    // biome-ignore lint/suspicious/noExplicitAny: proving the runtime guard
    render(<TransactionPreview {...({ amount: "12" } as any)} />);
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });
});

// R12 refusal: PROPERTY — whatever the props, the view carries no control that signs, sends,
// approves, confirms or executes.
const FORBIDDEN_CONTROL =
  /sign|send|approve|confirm|execute|submit|broadcast|authori[sz]e|\bpay\b|signer|envoyer|approuver|confirmer|exécuter|valider|autoriser|payer|diffuser/i;
const variants: Array<Record<string, unknown>> = [
  transfer,
  swap,
  { ...swap, locale: "fr" },
  { ...transfer, warnings: ["x"], simulation: { status: "unavailable" } },
  { ...swap, handoff: undefined },
];

describe("TransactionPreview refuses any sign / send control (R12)", () => {
  it("no interactive element in any variant is named like a sign / send / approve / confirm action", () => {
    for (const v of variants) {
      for (const withHandler of [false, true]) {
        const { container, unmount } = render(
          // biome-ignore lint/suspicious/noExplicitAny: variant props
          <TransactionPreview {...(v as any)} onHandoff={withHandler ? () => {} : undefined} />,
        );
        const controls = container.querySelectorAll(
          'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]',
        );
        for (const el of controls) {
          const name = `${el.textContent ?? ""} ${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("value") ?? ""} ${el.getAttribute("type") ?? ""}`;
          expect(name, name).not.toMatch(FORBIDDEN_CONTROL);
        }
        expect(container.querySelectorAll('input[type="submit"], form')).toHaveLength(0);
        unmount();
      }
    }
  });

  it("the view source and the schema declare no signing or sending handler or call", () => {
    const dir = import.meta.dirname ?? __dirname;
    const FORBIDDEN_SOURCE =
      /\b(onSign|onSend|onApprove|onConfirm|onExecute|onSubmit|signTransaction|sendTransaction|signTypedData|eth_sendTransaction|eth_sign|personal_sign|sendRawTransaction)\b/;
    for (const file of ["TransactionPreview.tsx", "TransactionPreview.schema.ts"]) {
      const src = readFileSync(join(dir, file), "utf8");
      expect(src, file).not.toMatch(FORBIDDEN_SOURCE);
    }
    expect(Object.keys(TransactionPreviewPropsSchema.shape ?? {}).join(" ")).not.toMatch(
      /sign|send|approve|execute/i,
    );
  });
});

describe("TransactionPreview A-1 markdown", () => {
  it("carries the NOT SIGNED sentence and the field table (EN)", () => {
    const md = transactionPreviewToMarkdown(transfer, "en");
    expect(md).toContain("# Transaction preview");
    expect(md).toContain("NOT SIGNED - preparation only");
    expect(md).toContain("| From | 0x1111111111111111111111111111111111111111 |");
    expect(md).toContain("| Amount | 12.5 FUSE |");
    expect(md).toContain("| Network fee | 0.0021 FUSE |");
    expect(md).toContain("Simulation succeeded");
  });

  it("covers the swap quote, warnings and handoff url, and FR", () => {
    const md = transactionPreviewToMarkdown({ ...swap, timeZone: "UTC" }, "en");
    expect(md).toContain("| Sell | 100 USDC |");
    expect(md).toContain("| Buy | 99.2 FUSE |");
    expect(md).toContain("USDC > WFUSE > FUSE");
    expect(md).toContain("1.35%");
    expect(md).toContain("Low liquidity");
    expect(md).toContain("https://wallet.example/swap?q=1");
    expect(transactionPreviewToMarkdown(swap, "fr")).toContain(
      "NON SIGNÉ - préparation uniquement",
    );
  });

  it("is meaningful when empty and always keeps the sentence", () => {
    expect(transactionPreviewToMarkdown({}, "en")).toContain("No transaction to preview");
    expect(transactionPreviewToMarkdown({}, "en")).toContain("NOT SIGNED - preparation only");
  });
});

describe("TransactionPreview schema", () => {
  it("defaults so {} parses; testnet false; kind transfer", () => {
    expect(TransactionPreviewPropsSchema.parse({})).toMatchObject({
      kind: "transfer",
      testnet: false,
      warnings: [],
      loading: false,
      locale: "en",
    });
  });
});
