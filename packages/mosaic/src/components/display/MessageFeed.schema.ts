import { z } from "zod";

// i18nKeys: MessageFeed.title, MessageFeed.unread, MessageFeed.attachment, MessageFeed.showing, MessageFeed.empty.message, MessageFeed.loading, MessageFeed.error.invalidProps

export const FeedMessageSchema = z.object({
  id: z.string().optional(),
  sender: z.string().min(1),
  channel: z.string().optional(),
  /** Plain text. Rendered as text, never as HTML. */
  content: z.string(),
  /** ISO 8601. */
  timestamp: z.string(),
  attachmentUrl: z.string().optional(),
  attachmentLabel: z.string().optional(),
  unread: z.boolean().optional(),
});

export type FeedMessage = z.infer<typeof FeedMessageSchema>;

/**
 * MessageFeed (R03): VantagePeers messages as a READ-ONLY feed — not a chat input (Claude's
 * design guidelines list chat inputs under patterns to avoid; the host composer exists).
 * Messages are ordered oldest first; `maxItems` keeps the latest N (Claude inline: last few).
 * `{}` parses (ChatGPT entrypoint default).
 */
export const MessageFeedPropsSchema = z.object({
  messages: z.array(FeedMessageSchema).default([]),
  maxItems: z.number().int().positive().optional(),
  /** IANA timezone for timestamps (e.g. `hostContext.timeZone`). */
  timeZone: z.string().optional(),
  /** Above this many shown messages the feed is virtualised through VirtualList. */
  virtualizeThreshold: z.number().int().positive().default(50),
  loading: z.boolean().default(false),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type MessageFeedProps = z.input<typeof MessageFeedPropsSchema>;
export type MessageFeedPropsOutput = z.output<typeof MessageFeedPropsSchema>;

export function validateMessageFeedProps(raw: unknown): MessageFeedPropsOutput {
  return MessageFeedPropsSchema.parse(raw);
}

/** The latest `maxItems` messages (all when unset) and how many exist. */
export function latestMessages(
  messages: readonly FeedMessage[],
  maxItems: number | undefined,
): { shown: FeedMessage[]; total: number } {
  const shown = maxItems === undefined ? [...messages] : messages.slice(-maxItems);
  return { shown, total: messages.length };
}
