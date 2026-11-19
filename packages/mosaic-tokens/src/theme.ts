/**
 * Theme as data: a per-deployment document of token overrides, keyed by the naming contract (light
 * and dark). ONE parser validates it everywhere (the server at load, the config view on each result).
 * LOUD: an unknown token or an invalid value is refused naming the token, every bad token listed,
 * never ignored. The document becomes CSS custom properties only after it parsed.
 *
 * Zero runtime dependencies: the validation is hand-written so a server can validate a theme by
 * depending on this package alone. Document-level messages keep the texts the previous schema-library
 * parser produced (servers log them); `__tests__/theme.test.ts` pins each one.
 */
import contract from "../naming-contract.json";

/** The canonical token names, DERIVED from the naming contract (never a hand-typed list). */
export const THEME_TOKEN_NAMES: ReadonlySet<string> = new Set(contract.names);

const MAX_VALUE_LENGTH = 200;
/** Characters and functions that could close a declaration or a rule, load a resource, or open markup. */
const FORBIDDEN_VALUE = /[;{}<>\\@]|url\(|expression\(/i;
const COLOR_FUNCTION = /^(?:oklch|oklab|rgba?|hsla?)\([0-9a-z.%\s,/+-]+\)$/i;
const COLOR_HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_VAR = /^var\(--mosaic-[a-z0-9-]+\)$/;
const COLOR_PREFIX = "--mosaic-color-";

/** The document's own keys, in the order their issues are reported. */
const DOCUMENT_KEYS = ["schemaVersion", "name", "light", "dark"] as const;
const SCOPES = ["light", "dark"] as const;

export interface ThemeIssue {
  /** "light" | "dark" for a token problem; absent for a problem of the document itself. */
  scope?: "light" | "dark";
  /** The offending token name, when the issue is about one. */
  token?: string;
  message: string;
}

/** Thrown by `parseThemeDocument`; `issues` lists every problem, not only the first. */
export class ThemeError extends Error {
  readonly issues: ThemeIssue[];
  constructor(issues: ThemeIssue[]) {
    super(`invalid theme: ${issues.map((i) => i.message).join("; ")}`);
    this.name = "ThemeError";
    this.issues = issues;
  }
}

export interface ThemeDocument {
  schemaVersion: 1;
  name?: string;
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

function valueProblem(token: string, value: unknown): string | undefined {
  if (typeof value !== "string" || value === "") {
    return `${token}: the value must be a non-empty string`;
  }
  if (value.length > MAX_VALUE_LENGTH) {
    return `${token}: the value is longer than ${MAX_VALUE_LENGTH} characters`;
  }
  if (FORBIDDEN_VALUE.test(value)) {
    return `${token}: the value contains a forbidden character or function`;
  }
  if (
    token.startsWith(COLOR_PREFIX) &&
    !(COLOR_FUNCTION.test(value) || COLOR_HEX.test(value) || COLOR_VAR.test(value))
  ) {
    return `${token}: not a colour (oklch, oklab, rgb, hsl, #hex or var(--mosaic-…))`;
  }
  return undefined;
}

/** Any non-null, non-array object (the document itself). */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A plain object (a token block): an object literal, a null-prototype object, or a plain object from
 * another realm; never an array, a Date, a Map or a class instance.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  const ctor: unknown = value.constructor;
  if (typeof ctor !== "function") return true;
  const proto: unknown = ctor.prototype;
  return isObject(proto) && Object.prototype.hasOwnProperty.call(proto, "isPrototypeOf");
}

/** How a received value is named in a message: `string`, `null`, `array`, `NaN`, `Date`, ... */
function received(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? "number" : String(value);
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && Object.getPrototypeOf(value) !== Object.prototype) {
    const ctor = (value as { constructor?: { name?: unknown } }).constructor;
    if (ctor && typeof ctor.name === "string") return ctor.name;
  }
  return typeof value;
}

function tokenIssues(scope: "light" | "dark", block: Record<string, unknown>): ThemeIssue[] {
  const issues: ThemeIssue[] = [];
  // Object.keys, not for..in: own keys only, and a JSON `"__proto__"` key is an own key here, so it
  // is refused as an unknown token rather than skipped.
  for (const token of Object.keys(block)) {
    const message = THEME_TOKEN_NAMES.has(token)
      ? valueProblem(token, block[token])
      : `unknown token ${token}`;
    if (message) issues.push({ scope, token, message });
  }
  return issues;
}

function copyBlock(block: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const token of Object.keys(block)) out[token] = block[token] as string;
  return out;
}

/** Validates a theme document; throws `ThemeError` listing every problem, not only the first. */
export function parseThemeDocument(input: unknown): ThemeDocument {
  if (!isObject(input)) {
    throw new ThemeError([
      { message: `Invalid input: expected object, received ${received(input)}` },
    ]);
  }
  const issues: ThemeIssue[] = [];

  if (input.schemaVersion !== 1) {
    issues.push({ message: "schemaVersion: Invalid input: expected 1" });
  }

  const name = input.name;
  if (name !== undefined) {
    if (typeof name !== "string") {
      issues.push({ message: `name: Invalid input: expected string, received ${received(name)}` });
    } else if (name.length > MAX_VALUE_LENGTH) {
      issues.push({
        message: `name: Too big: expected string to have <=${MAX_VALUE_LENGTH} characters`,
      });
    }
  }

  for (const scope of SCOPES) {
    const block = input[scope];
    if (block === undefined) continue;
    if (!isPlainObject(block)) {
      issues.push({
        scope,
        message: `${scope}: Invalid input: expected record, received ${received(block)}`,
      });
    } else {
      issues.push(...tokenIssues(scope, block));
    }
  }

  const unknownKeys = Object.keys(input).filter(
    (k) => !(DOCUMENT_KEYS as readonly string[]).includes(k),
  );
  if (unknownKeys.length > 0) {
    issues.push({
      message: `Unrecognized key${unknownKeys.length > 1 ? "s" : ""}: ${unknownKeys
        .map((k) => `"${k}"`)
        .join(", ")}`,
    });
  }

  // Checked only on an otherwise valid document, as before: one root cause, one message.
  if (issues.length === 0 && input.light === undefined && input.dark === undefined) {
    issues.push({ message: "a theme needs at least one of light or dark" });
  }

  if (issues.length > 0) throw new ThemeError(issues);

  const doc: ThemeDocument = { schemaVersion: 1 };
  if ("name" in input) doc.name = name as string | undefined;
  for (const scope of SCOPES) {
    if (!(scope in input)) continue;
    const block = input[scope];
    doc[scope] = block === undefined ? undefined : copyBlock(block as Record<string, unknown>);
  }
  return doc;
}

const block = (selector: string, tokens: Record<string, string> | undefined): string => {
  const decls = Object.entries(tokens ?? {}).map(([k, v]) => `${k}:${v};`);
  return decls.length > 0 ? `${selector}{${decls.join("")}}` : "";
};

/**
 * The CSS of an ALREADY PARSED document. Each block is scoped so it cannot match while the other scheme
 * is active: light on `:root:not([data-theme="dark"])` (specificity 0,2,0 > the tokens' `:root`), dark on
 * `:root[data-theme="dark"]` (0,2,0 > the tokens' `[data-theme="dark"]`). The theme `<style>` is appended
 * last, so a light-only theme can never paint over the dark defaults of a dark host.
 */
export function themeToCss(theme: ThemeDocument): string {
  return (
    block(':root:not([data-theme="dark"])', theme.light) +
    block(':root[data-theme="dark"]', theme.dark)
  );
}
