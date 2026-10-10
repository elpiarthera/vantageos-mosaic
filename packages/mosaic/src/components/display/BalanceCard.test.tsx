import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BalanceCard } from "./BalanceCard";
import { balanceCardToMarkdown } from "./BalanceCard.markdown";
import { BalanceCardPropsSchema } from "./BalanceCard.schema";

afterEach(cleanup);

// Source: fuse-mcp-server src/tools/getBalance.ts returns
// { address, token, tokenAddress?, decimals, balanceRaw?, balanceWei?, balanceFormatted }.
const base = {
  token: "FUSE",
  balance: "12345678901234567890.123456789012345678",
  address: "0x1234567890abcdef1234567890abcdef12345678",
  network: "Fuse",
};

describe("BalanceCard (R09, composes StatCard)", () => {
  it("shows the amount as the exact decimal string, with the token symbol", () => {
    render(<BalanceCard {...base} />);
    expect(screen.queryAllByText("12345678901234567890.123456789012345678")).toHaveLength(1);
    expect(screen.queryAllByText("FUSE")).toHaveLength(1);
  });

  it("shows the network and a testnet badge when testnet", () => {
    render(<BalanceCard {...base} testnet />);
    expect(screen.queryAllByText("Fuse")).toHaveLength(1);
    expect(screen.queryAllByText("Testnet")).toHaveLength(1);
  });

  it("does not show a testnet badge on mainnet", () => {
    render(<BalanceCard {...base} />);
    expect(screen.queryAllByText("Testnet")).toHaveLength(0);
  });

  it("truncates the address visually but keeps the full address available", () => {
    render(<BalanceCard {...base} />);
    expect(screen.queryAllByText("0x1234…5678")).toHaveLength(1);
    expect(document.querySelector(`[title="${base.address}"]`)).not.toBeNull();
  });

  it("copies the full address through the clipboard when available and says so", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<BalanceCard {...base} />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Copy address" })[0] as HTMLElement);
    });
    expect(writeText).toHaveBeenCalledWith(base.address);
    expect(screen.queryAllByText("Address copied")).toHaveLength(1);
  });

  it("offers no copy button when the clipboard is unavailable (sandboxed iframe)", () => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    render(<BalanceCard {...base} />);
    expect(screen.queryAllByRole("button", { name: "Copy address" })).toHaveLength(0);
  });

  it("shows the USD value when given", () => {
    render(<BalanceCard {...base} usdValue="4321.5" />);
    expect(screen.queryAllByText(/4321\.5/)).toHaveLength(1);
  });

  it("has a Skeleton loading state, an empty-args default and an alert on invalid props", () => {
    const { unmount } = render(<BalanceCard {...base} loading />);
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    unmount();
    render(<BalanceCard />);
    expect(screen.queryAllByText("No balance to display")).toHaveLength(1);
    cleanup();
    // biome-ignore lint/suspicious/noExplicitAny: proving the runtime guard
    render(<BalanceCard {...({ balance: 12 } as any)} />);
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });

  it("localises (FR)", () => {
    render(<BalanceCard {...base} testnet locale="fr" />);
    expect(screen.queryAllByText("Réseau de test")).toHaveLength(1);
  });
});

describe("BalanceCard schema + A-1 markdown", () => {
  it("defaults so {} parses; testnet defaults to false", () => {
    expect(BalanceCardPropsSchema.parse({})).toMatchObject({ testnet: false, locale: "en" });
  });

  it("states token: balance (network) with the full address", () => {
    const md = balanceCardToMarkdown({ ...base, testnet: true }, "en");
    expect(md).toContain("FUSE: 12345678901234567890.123456789012345678");
    expect(md).toContain("Fuse");
    expect(md).toContain("Testnet");
    expect(md).toContain(base.address);
  });

  it("is localised in FR and meaningful when empty", () => {
    expect(balanceCardToMarkdown(base, "fr")).toContain("Solde");
    expect(balanceCardToMarkdown({}, "en")).toContain("No balance to display");
  });
});
