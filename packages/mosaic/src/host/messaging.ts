// RED stub: behaviour lands in the next commit.
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
export interface MessagingAppLike {
  getHostContext(): Record<string, unknown> | undefined;
  getHostCapabilities?(): { experimental?: Record<string, unknown> } | undefined;
  sendMessage?(params: unknown): Promise<{ isError?: boolean }>;
  openLink?(params: { url: string }): Promise<{ isError?: boolean }>;
}
export async function sendMessage(
  _app: MessagingAppLike,
  _text: string,
  _options?: SendMessageOptions,
): Promise<void> {}
export async function openLink(_app: MessagingAppLike, _url: string): Promise<void> {}
