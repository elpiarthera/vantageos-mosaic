import { z } from "zod";

// i18nKeys: MessageFeed.title, MessageFeed.unread, MessageFeed.attachment, MessageFeed.showing, MessageFeed.empty.message, MessageFeed.loading, MessageFeed.error.invalidProps
// RED stub schema.
export const MessageFeedPropsSchema = z.object({}).passthrough();
export type MessageFeedProps = Record<string, unknown>;
export type MessageFeedPropsOutput = Record<string, unknown>;
export type FeedMessage = Record<string, unknown>;
export function validateMessageFeedProps(raw: unknown): MessageFeedPropsOutput {
  return MessageFeedPropsSchema.parse(raw);
}
