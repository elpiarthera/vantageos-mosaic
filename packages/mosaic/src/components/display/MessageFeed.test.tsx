import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MessageFeed } from "./MessageFeed";
import { messageFeedToMarkdown } from "./MessageFeed.markdown";
import { MessageFeedPropsSchema } from "./MessageFeed.schema";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: (opts: { count: number; estimateSize: (i: number) => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: opts.count }, (_, i) => ({
        index: i,
        start: i * 80,
        size: 80,
        end: (i + 1) * 80,
        lane: 0,
        key: i,
      })),
    getTotalSize: () => opts.count * 80,
  }),
}));

afterEach(cleanup);

// R03: VantagePeers messages as a read-only feed (not a chat input: Claude guidelines list chat
// inputs under "avoid"). Claude inline: last few messages; fullscreen: the scrollable feed.
const messages = [
  {
    id: "m1",
    sender: "pi",
    channel: "gamma",
    content: "Start the build",
    timestamp: "2026-10-10T08:00:00Z",
  },
  {
    id: "m2",
    sender: "gamma",
    channel: "pi",
    content: "Done, PR open",
    timestamp: "2026-10-10T09:30:00Z",
    unread: true,
    attachmentUrl: "https://github.com/x/y/pull/1",
    attachmentLabel: "PR 1",
  },
  { id: "m3", sender: "eta", content: "Approved", timestamp: "2026-10-10T10:00:00Z" },
];

describe("MessageFeed (R03)", () => {
  it("renders each message with sender, content and a formatted time, oldest first", () => {
    render(<MessageFeed messages={messages} timeZone="UTC" />);
    const items = screen.queryAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]?.textContent).toContain("pi");
    expect(items[0]?.textContent).toContain("Start the build");
    expect(items[0]?.textContent).toMatch(/Oct 10, 2026/);
    expect(items[2]?.textContent).toContain("Approved");
  });

  it("shows the channel and an Unread marker in words", () => {
    render(<MessageFeed messages={messages} timeZone="UTC" />);
    expect(screen.queryAllByText("gamma").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Unread")).toHaveLength(1);
  });

  it("renders content as plain text, never as HTML", () => {
    render(
      <MessageFeed
        messages={[
          { id: "x", sender: "a", content: "<img src=x onerror=alert(1)>", timestamp: "2026-10-10T08:00:00Z" },
        ]}
      />,
    );
    expect(document.querySelector("img")).toBeNull();
    expect(screen.queryAllByText("<img src=x onerror=alert(1)>")).toHaveLength(1);
  });

  it("links an http(s) attachment, with rel=noopener noreferrer", () => {
    render(<MessageFeed messages={messages} timeZone="UTC" />);
    const link = screen.queryAllByRole("link", { name: /PR 1/ });
    expect(link).toHaveLength(1);
    expect(link[0]?.getAttribute("href")).toBe("https://github.com/x/y/pull/1");
    expect(link[0]?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("routes the attachment through onOpenLink (host ui/open-link) when given", () => {
    const onOpenLink = vi.fn();
    render(<MessageFeed messages={messages} onOpenLink={onOpenLink} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    fireEvent.click(screen.getAllByRole("button", { name: /PR 1/ })[0] as HTMLElement);
    expect(onOpenLink).toHaveBeenCalledWith("https://github.com/x/y/pull/1");
  });

  it("does not link an unsafe attachment URL; the label stays as text", () => {
    render(
      <MessageFeed
        messages={[
          {
            id: "u",
            sender: "a",
            content: "x",
            timestamp: "2026-10-10T08:00:00Z",
            attachmentUrl: "javascript:alert(1)",
            attachmentLabel: "evil",
          },
        ]}
      />,
    );
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: /evil/ })).toHaveLength(0);
    expect(screen.queryAllByText("evil")).toHaveLength(1);
  });

  it("maxItems keeps the LATEST messages and says so (Claude inline: last few)", () => {
    render(<MessageFeed messages={messages} maxItems={2} timeZone="UTC" />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryAllByText("Start the build")).toHaveLength(0);
    expect(screen.queryAllByText("Showing the latest 2 of 3")).toHaveLength(1);
  });

  it("virtualises above the threshold through VirtualList", () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      id: `m${i}`,
      sender: "s",
      content: `msg ${i}`,
      timestamp: "2026-10-10T08:00:00Z",
    }));
    render(<MessageFeed messages={many} virtualizeThreshold={50} />);
    expect(screen.queryAllByText("msg 59")).toHaveLength(1);
    expect(document.querySelector('[data-virtual="true"], [data-virtual-list]')).not.toBeNull();
  });

  it("localises (FR)", () => {
    render(<MessageFeed messages={messages} locale="fr" timeZone="UTC" />);
    expect(screen.queryAllByText("Non lu")).toHaveLength(1);
    expect(screen.queryAllByText(/10 oct\. 2026/).length).toBeGreaterThan(0);
  });

  it("Skeleton while loading, empty state for {}, alert on invalid props", () => {
    const a = render(<MessageFeed messages={messages} loading />);
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    a.unmount();
    const b = render(<MessageFeed />);
    expect(screen.queryAllByText("No messages")).toHaveLength(1);
    b.unmount();
    // biome-ignore lint/suspicious/noExplicitAny: proving the runtime guard
    render(<MessageFeed {...({ messages: [{ sender: 1 }] } as any)} />);
    expect(screen.queryAllByRole("alert")).toHaveLength(1);
  });
});

describe("MessageFeed schema + A-1 markdown", () => {
  it("defaults so {} parses", () => {
    expect(MessageFeedPropsSchema.parse({})).toMatchObject({
      messages: [],
      virtualizeThreshold: 50,
      loading: false,
      locale: "en",
    });
  });

  it("carries sender, time, channel and content as blockquotes", () => {
    const md = messageFeedToMarkdown({ messages, timeZone: "UTC" }, "en");
    expect(md).toContain("# Messages");
    expect(md).toContain("> **pi** (Oct 10, 2026");
    expect(md).toContain("gamma): Start the build");
    expect(md).toContain("PR 1");
    expect(md).toContain("https://github.com/x/y/pull/1");
  });

  it("keeps only the latest maxItems and names the cut; FR and empty cases", () => {
    const md = messageFeedToMarkdown({ messages, maxItems: 1, timeZone: "UTC" }, "en");
    expect(md).toContain("Approved");
    expect(md).not.toContain("Start the build");
    expect(md).toContain("Showing the latest 1 of 3");
    expect(messageFeedToMarkdown({ messages }, "fr")).toContain("# Messages");
    expect(messageFeedToMarkdown({}, "fr")).toContain("Aucun message");
  });
});
