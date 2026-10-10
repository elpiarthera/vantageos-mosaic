/**
 * The parsed, normalised form of an http(s) URL (`new URL(x).href`), or `undefined`. Emit THIS,
 * never the raw input: the parser strips tabs/newlines and percent-encodes spaces, so a raw
 * string with an embedded newline cannot reach a fallback or the host as a second line.
 */
export function normalizeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : undefined;
  } catch {
    return undefined;
  }
}
