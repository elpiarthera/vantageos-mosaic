/**
 * `ui/message` (H04) and `ui/open-link` (H18) helpers over the structural ext-apps `App`.
 *
 * Spec: MCP Apps 2026-01-26 (ext-apps-spec.mdx)
 *   l.965-995   `ui/open-link`: params `{ url: string }`, empty result, error -32000 with
 *               "Link opening denied by user" | "Invalid URL" | "Policy violation".
 *   l.998-1030  `ui/message`: params `{ role: "user", content }`, error -32000 with
 *               "Message sending denied" | "Invalid message format".
 *   DECLARED DIVERGENCE: the spec text shows `content` as one block; ext-apps 1.7.3
 *   (`McpUiMessageRequest`, spec.types.d.ts) and the OpenAI extension (`content:
 *   MCP.ContentBlock[]`, openai-mcp-ext-spec.md l.1153-1160) both use an ARRAY, so an array is sent.
 * OpenAI extension (openai-mcp-ext-spec.md l.1100-1235):
 *   capability `hostCapabilities.experimental["openai/message"]` (l.1106);
 *   `params._meta["openai/message"] = { target?: "active" | "new", send?: boolean }` (l.1153-1170);
 *   defaults `{ target: "active", send: true }` (l.1147); on iOS and Android only the defaults are
 *   supported (l.1148). `hostContext.platform: "web" | "desktop" | "mobile"` is MCP Apps spec l.573.
 * A non-default option the host cannot honour is REFUSED, never silently dropped: dropping
 * `send: false` would send the message the caller meant to leave as a draft.
 */
import { normalizeHttpUrl } from "../components/shared/url.js";
import type { HostAppLike } from "./host-context.js";

/** Failure of a host request (`ui/message`, `ui/open-link`): carries the method and the reason. */
export class HostRequestError extends Error {
  readonly method: string;
  readonly reason: string;
  constructor(method: string, reason: string) {
    super(`${method}: ${reason}`);
    this.name = "HostRequestError";
    this.method = method;
    this.reason = reason;
  }
}

export interface SendMessageOptions {
  target?: "active" | "new";
  send?: boolean;
}

export type MessagingAppLike = Pick<
  HostAppLike,
  "getHostContext" | "getHostCapabilities" | "sendMessage" | "openLink"
>;

function reasonOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Sends `text` as a user message. Options need `openai/message` and a non-mobile platform. */
export async function sendMessage(
  app: MessagingAppLike,
  text: string,
  options?: SendMessageOptions,
): Promise<void> {
  const method = "ui/message";
  if (typeof app.sendMessage !== "function") {
    throw new HostRequestError(method, "the host app exposes no sendMessage");
  }
  if (text.trim() === "") throw new HostRequestError(method, "empty message");
  const params: {
    role: "user";
    content: Array<{ type: "text"; text: string }>;
    _meta?: { "openai/message": SendMessageOptions };
  } = { role: "user", content: [{ type: "text", text }] };

  const isDefault =
    options === undefined ||
    ((options.target === undefined || options.target === "active") &&
      (options.send === undefined || options.send === true));
  if (!isDefault) {
    const experimental = app.getHostCapabilities?.()?.experimental;
    if (experimental === undefined || !("openai/message" in experimental)) {
      throw new HostRequestError(
        method,
        'the host does not advertise "openai/message": target/send options are unsupported',
      );
    }
    if (app.getHostContext()?.platform === "mobile") {
      throw new HostRequestError(
        method,
        "on mobile only { target: active, send: true } is supported",
      );
    }
    params._meta = { "openai/message": { ...options } };
  }

  let result: { isError?: boolean };
  try {
    result = await app.sendMessage(params);
  } catch (err) {
    throw new HostRequestError(method, reasonOf(err));
  }
  if (result?.isError) throw new HostRequestError(method, "the host rejected the message");
}

/** Asks the host to open an http(s) URL. A denial is thrown with the host's own reason. */
export async function openLink(app: MessagingAppLike, url: string): Promise<void> {
  const method = "ui/open-link";
  if (typeof app.openLink !== "function") {
    throw new HostRequestError(method, "the host app exposes no openLink");
  }
  // Hand the host the PARSED href: a raw string may embed newlines or spaces the parser normalises.
  const href = normalizeHttpUrl(url);
  if (!href) throw new HostRequestError(method, "Invalid URL");
  let result: { isError?: boolean };
  try {
    result = await app.openLink({ url: href });
  } catch (err) {
    throw new HostRequestError(method, reasonOf(err));
  }
  if (result?.isError) throw new HostRequestError(method, "Link opening denied");
}
