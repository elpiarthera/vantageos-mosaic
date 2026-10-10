// i18nKeys: MessageFeed.title, MessageFeed.unread, MessageFeed.attachment, MessageFeed.showing, MessageFeed.empty.message, MessageFeed.loading, MessageFeed.error.invalidProps

import React from "react";
import { type MosaicLocale, t } from "../../i18n/strings.js";
import { Badge } from "../../runtimes/react/components/display/Badge.js";
import { EmptyState } from "../../runtimes/react/components/display/EmptyState.js";
import { Skeleton } from "../../runtimes/react/components/display/Skeleton.js";
import { VirtualList } from "../../runtimes/react/components/display/VirtualList.js";
import { formatTimestamp } from "../shared/datetime.js";
import { isHttpUrl } from "../shared/url.js";
import {
  type FeedMessage,
  type MessageFeedProps,
  MessageFeedPropsSchema,
  latestMessages,
} from "./MessageFeed.schema.js";

export type MessageFeedViewProps = MessageFeedProps & {
  /**
   * Route attachment links through the host (`ui/open-link`, see `openLink` in ./host) —
   * sandboxed views cannot navigate. Without it an http(s) attachment is a plain anchor.
   */
  onOpenLink?: (url: string) => void;
};

function Attachment({
  m,
  locale,
  onOpenLink,
}: { m: FeedMessage; locale: MosaicLocale; onOpenLink?: (url: string) => void }) {
  if (!m.attachmentUrl) return null;
  const label = m.attachmentLabel ?? t("MessageFeed.attachment", locale);
  if (!isHttpUrl(m.attachmentUrl)) return <span className="text-sm text-slate-500">{label}</span>;
  const url = m.attachmentUrl;
  return onOpenLink ? (
    <button
      type="button"
      onClick={() => onOpenLink(url)}
      className="text-left text-sm text-blue-700 underline"
    >
      {label}
    </button>
  ) : (
    <a
      href={url}
      rel="noopener noreferrer"
      target="_blank"
      className="text-sm text-blue-700 underline"
    >
      {label}
    </a>
  );
}

function Message({
  m,
  locale,
  timeZone,
  onOpenLink,
}: {
  m: FeedMessage;
  locale: MosaicLocale;
  timeZone?: string;
  onOpenLink?: (url: string) => void;
}) {
  return (
    <article className="flex flex-col gap-1 border-b border-slate-100 py-2">
      <header className="flex flex-wrap items-center gap-2 text-sm">
        <strong className="text-slate-900">{m.sender}</strong>
        {m.channel ? <Badge label={m.channel} variant="neutral" locale={locale} /> : null}
        <time dateTime={m.timestamp} className="text-xs text-slate-500">
          {formatTimestamp(m.timestamp, locale, timeZone)}
        </time>
        {m.unread ? (
          <span className="text-xs font-semibold text-blue-700">
            {t("MessageFeed.unread", locale)}
          </span>
        ) : null}
      </header>
      <p className="m-0 whitespace-pre-wrap text-sm text-slate-800">{m.content}</p>
      <Attachment m={m} locale={locale} onOpenLink={onOpenLink} />
    </article>
  );
}

/**
 * MessageFeed — read-only message feed (R03). Plain-text content, safe attachment links, the
 * latest `maxItems` for inline cards, VirtualList above `virtualizeThreshold`. Not a chat input.
 */
export function MessageFeed(raw: MessageFeedViewProps = {}) {
  const parsed = MessageFeedPropsSchema.safeParse(raw);
  const locale: MosaicLocale =
    (raw as { locale?: string } | undefined)?.locale === "fr" ? "fr" : "en";
  if (!parsed.success) {
    return <div role="alert">{t("MessageFeed.error.invalidProps", locale)}</div>;
  }
  const p = parsed.data;
  if (p.loading) {
    return (
      <div aria-busy="true" aria-label={t("MessageFeed.loading", p.locale)}>
        <Skeleton variant="text" count={5} locale={p.locale} />
      </div>
    );
  }
  if (p.messages.length === 0) {
    return <EmptyState title={t("MessageFeed.empty.message", p.locale)} locale={p.locale} />;
  }
  const { shown, total } = latestMessages(p.messages, p.maxItems);
  const virtual = shown.length > p.virtualizeThreshold;
  return (
    <section aria-label={t("MessageFeed.title", p.locale)} lang={p.locale}>
      {shown.length < total ? (
        <p className="m-0 pb-1 text-xs text-slate-500">
          {t("MessageFeed.showing", p.locale)
            .replace("{n}", String(shown.length))
            .replace("{total}", String(total))}
        </p>
      ) : null}
      {virtual ? (
        <VirtualList
          items={shown}
          itemHeight={96}
          locale={p.locale}
          renderItem={(m) => (
            <Message m={m} locale={p.locale} timeZone={p.timeZone} onOpenLink={raw.onOpenLink} />
          )}
        />
      ) : (
        <ol className="m-0 list-none p-0">
          {shown.map((m, i) => (
            <li key={m.id ?? `msg-${i}`}>
              <Message m={m} locale={p.locale} timeZone={p.timeZone} onOpenLink={raw.onOpenLink} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
