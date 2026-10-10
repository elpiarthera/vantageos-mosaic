/**
 * Locale date-time formatting for views. An unparseable timestamp is returned unchanged (visible,
 * not replaced by a guess). `timeZone` is passed through so output is reproducible in tests and
 * follows the host's `hostContext.timeZone` (MCP Apps spec l.570).
 */
export function formatTimestamp(iso: string, locale: string, timeZone?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      ...(timeZone ? { timeZone } : {}),
    }).format(d);
  } catch {
    return iso;
  }
}
