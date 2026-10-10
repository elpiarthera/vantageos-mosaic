/** Only http(s) URLs are ever linked or handed to the host: `javascript:` / `data:` are dropped. */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
