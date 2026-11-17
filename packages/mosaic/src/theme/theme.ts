/**
 * Theme as data: a per-deployment document of token overrides, keyed by the mosaic-tokens naming
 * contract (light and dark). ONE parser validates it everywhere (the server at load, the config view
 * on each result). LOUD: an unknown token or an invalid value is refused naming the token, every bad
 * token listed, never ignored. The document becomes CSS custom properties only after it parsed.
 */
import * as z from "zod";
import contract from "../../../mosaic-tokens/naming-contract.json";

/** The canonical token names, DERIVED from the naming contract (never a hand-typed list). */
export const THEME_TOKEN_NAMES: ReadonlySet<string> = new Set(contract.names);

const MAX_VALUE_LENGTH = 200;
/** Characters and functions that could close a declaration or a rule, load a resource, or open markup. */
const FORBIDDEN_VALUE = /[;{}<>\\@]|url\(|expression\(/i;
const COLOR_FUNCTION = /^(?:oklch|oklab|rgba?|hsla?)\([0-9a-z.%\s,/+-]+\)$/i;
const COLOR_HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_VAR = /^var\(--mosaic-[a-z0-9-]+\)$/;
const COLOR_PREFIX = "--mosaic-color-";

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

const TokenMap = z.record(z.string(), z.unknown()).superRefine((record, ctx) => {
  for (const [token, value] of Object.entries(record)) {
    const message = THEME_TOKEN_NAMES.has(token)
      ? valueProblem(token, value)
      : `unknown token ${token}`;
    if (message) ctx.addIssue({ code: "custom", message, params: { token } });
  }
});

const ThemeDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: z.string().max(MAX_VALUE_LENGTH).optional(),
    light: TokenMap.optional(),
    dark: TokenMap.optional(),
  })
  .strict()
  .refine((d) => d.light !== undefined || d.dark !== undefined, {
    message: "a theme needs at least one of light or dark",
  });

export interface ThemeDocument {
  schemaVersion: 1;
  name?: string;
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

/** Validates a theme document; throws `ThemeError` listing every bad token. */
export function parseThemeDocument(input: unknown): ThemeDocument {
  const r = ThemeDocumentSchema.safeParse(input);
  if (r.success) return r.data as ThemeDocument;
  throw new ThemeError(
    r.error.issues.map((i) => {
      const scope = i.path[0] === "light" || i.path[0] === "dark" ? i.path[0] : undefined;
      const token = (i as { params?: { token?: string } }).params?.token;
      const where = i.path.length > 0 && !token ? `${i.path.join(".")}: ` : "";
      return {
        ...(scope ? { scope } : {}),
        ...(token ? { token } : {}),
        message: `${where}${i.message}`,
      };
    }),
  );
}

const block = (selector: string, tokens: Record<string, string> | undefined): string => {
  const decls = Object.entries(tokens ?? {}).map(([k, v]) => `${k}:${v};`);
  return decls.length > 0 ? `${selector}{${decls.join("")}}` : "";
};

/** The CSS of an ALREADY PARSED document: light on `:root`, dark under `[data-theme="dark"]`. */
export function themeToCss(theme: ThemeDocument): string {
  return block(":root", theme.light) + block('[data-theme="dark"]', theme.dark);
}
