/**
 * Decimal-string helpers. Token amounts and prices travel as decimal STRINGS (the Fuse tools
 * return `balanceFormatted` / `balanceRaw` strings): converting through `Number` loses digits
 * beyond 2^53 and rounds 18-decimal values. Everything here works on the digits.
 */
const DECIMAL = /^(-)?(\d+)(?:\.(\d+))?$/;

/** Exact sum; `undefined` when ANY input is not a plain decimal string (no silent skipping). */
export function sumDecimalStrings(values: readonly string[]): string | undefined {
  let scale = 0;
  const parsed: Array<{ neg: boolean; int: string; frac: string }> = [];
  for (const v of values) {
    const m = DECIMAL.exec(v);
    if (!m) return undefined;
    const frac = m[3] ?? "";
    scale = Math.max(scale, frac.length);
    parsed.push({ neg: m[1] === "-", int: m[2] ?? "0", frac });
  }
  let total = 0n;
  for (const p of parsed) {
    const n = BigInt(p.int + p.frac.padEnd(scale, "0"));
    total += p.neg ? -n : n;
  }
  const neg = total < 0n;
  const digits = (neg ? -total : total).toString().padStart(scale + 1, "0");
  const int = digits.slice(0, digits.length - scale);
  const frac = digits.slice(digits.length - scale).replace(/0+$/, "");
  return `${neg ? "-" : ""}${int}${frac ? `.${frac}` : ""}`;
}

/**
 * Locale formatting of a decimal string. `Intl.NumberFormat#format` accepts a numeric string and
 * keeps its digits exactly (ES2023 Intl.NumberFormat v3); on anything unformattable the raw
 * string is returned unchanged, so a bad value is visible rather than replaced by a guess.
 */
export function formatDecimalString(value: string, locale: string, currency?: string): string {
  if (!DECIMAL.test(value)) return value;
  try {
    const nf = new Intl.NumberFormat(
      locale,
      currency ? { style: "currency", currency } : { maximumFractionDigits: 20 },
    );
    return nf.format(value as unknown as number);
  } catch {
    return value;
  }
}

/** `0x1234…5678`: first `head` and last `tail` characters; short strings are returned whole. */
export function truncateAddress(address: string, head = 6, tail = 4): string {
  return address.length <= head + tail + 1
    ? address
    : `${address.slice(0, head)}…${address.slice(address.length - tail)}`;
}
