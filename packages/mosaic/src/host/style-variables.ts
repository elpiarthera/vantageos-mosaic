/**
 * Host style variables and fonts (H02) — framework-agnostic, structural (no ext-apps import).
 *
 * Spec: MCP Apps 2026-01-26 (ext-apps-spec.mdx):
 *   l.547-555  `HostContext.styles = { variables?: Record<McpUiStyleVariableKey, string|undefined>,
 *              css?: { fonts?: string } }`
 *   l.799-888  `McpUiStyleVariableKey`, the 76 standardized keys below (extracted from the spec
 *              block by command, not retyped)
 *   l.895-905  "Views should set default fallback values ... to account for hosts who don't pass
 *              some or all style variables": here the mosaic-tokens defaults are the fallback,
 *              because only the variables the host passes are written.
 * Claude transparent-theming page: fonts need `https://assets.claude.ai` in `resourceDomains`;
 * html and body backgrounds are set to `transparent`.
 * Composes with ext-apps `applyHostStyleVariables` / `applyDocumentTheme` structurally; either can
 * be used instead, nothing here imports them.
 */
export const MCP_STYLE_VARIABLE_KEYS = [
  "--color-background-primary",
  "--color-background-secondary",
  "--color-background-tertiary",
  "--color-background-inverse",
  "--color-background-ghost",
  "--color-background-info",
  "--color-background-danger",
  "--color-background-success",
  "--color-background-warning",
  "--color-background-disabled",
  "--color-text-primary",
  "--color-text-secondary",
  "--color-text-tertiary",
  "--color-text-inverse",
  "--color-text-info",
  "--color-text-danger",
  "--color-text-success",
  "--color-text-warning",
  "--color-text-disabled",
  "--color-text-ghost",
  "--color-border-primary",
  "--color-border-secondary",
  "--color-border-tertiary",
  "--color-border-inverse",
  "--color-border-ghost",
  "--color-border-info",
  "--color-border-danger",
  "--color-border-success",
  "--color-border-warning",
  "--color-border-disabled",
  "--color-ring-primary",
  "--color-ring-secondary",
  "--color-ring-inverse",
  "--color-ring-info",
  "--color-ring-danger",
  "--color-ring-success",
  "--color-ring-warning",
  "--font-sans",
  "--font-mono",
  "--font-weight-normal",
  "--font-weight-medium",
  "--font-weight-semibold",
  "--font-weight-bold",
  "--font-text-xs-size",
  "--font-text-sm-size",
  "--font-text-md-size",
  "--font-text-lg-size",
  "--font-heading-xs-size",
  "--font-heading-sm-size",
  "--font-heading-md-size",
  "--font-heading-lg-size",
  "--font-heading-xl-size",
  "--font-heading-2xl-size",
  "--font-heading-3xl-size",
  "--font-text-xs-line-height",
  "--font-text-sm-line-height",
  "--font-text-md-line-height",
  "--font-text-lg-line-height",
  "--font-heading-xs-line-height",
  "--font-heading-sm-line-height",
  "--font-heading-md-line-height",
  "--font-heading-lg-line-height",
  "--font-heading-xl-line-height",
  "--font-heading-2xl-line-height",
  "--font-heading-3xl-line-height",
  "--border-radius-xs",
  "--border-radius-sm",
  "--border-radius-md",
  "--border-radius-lg",
  "--border-radius-xl",
  "--border-radius-full",
  "--border-width-regular",
  "--shadow-hairline",
  "--shadow-sm",
  "--shadow-md",
  "--shadow-lg",
] as const;
export type McpStyleVariableKey = (typeof MCP_STYLE_VARIABLE_KEYS)[number];
export interface HostStyles {
  variables: Partial<Record<McpStyleVariableKey, string>>;
  fonts: string | undefined;
}

/**
 * Host variable -> mosaic-tokens custom properties it drives. Declared mapping (a design
 * decision, not a spec fact); `style-variables.test.ts` asserts every target exists in
 * `mosaic-tokens/src/tokens.css`.
 */
export const HOST_TO_MOSAIC_TOKENS: Partial<Record<McpStyleVariableKey, readonly string[]>> = {
  "--color-background-primary": [
    "--mosaic-color-background",
    "--mosaic-color-card",
    "--mosaic-color-popover",
  ],
  "--color-background-secondary": [
    "--mosaic-color-muted",
    "--mosaic-color-secondary",
    "--mosaic-color-accent",
  ],
  "--color-text-primary": [
    "--mosaic-color-foreground",
    "--mosaic-color-card-foreground",
    "--mosaic-color-popover-foreground",
    "--mosaic-color-secondary-foreground",
    "--mosaic-color-accent-foreground",
  ],
  "--color-text-secondary": ["--mosaic-color-muted-foreground"],
  "--color-border-primary": ["--mosaic-color-border", "--mosaic-color-input"],
  "--color-ring-primary": ["--mosaic-color-ring"],
  "--color-background-danger": ["--mosaic-color-danger-50"],
  "--color-text-danger": ["--mosaic-color-danger-700"],
  "--color-border-danger": ["--mosaic-color-danger-500"],
  "--color-background-success": ["--mosaic-color-success-50"],
  "--color-text-success": ["--mosaic-color-success-700"],
  "--color-border-success": ["--mosaic-color-success-500"],
  "--color-background-warning": ["--mosaic-color-warning-50"],
  "--color-text-warning": ["--mosaic-color-warning-700"],
  "--color-border-warning": ["--mosaic-color-warning-500"],
  "--color-background-info": ["--mosaic-color-info-50"],
  "--color-text-info": ["--mosaic-color-info-700"],
  "--color-border-info": ["--mosaic-color-info-500"],
  "--font-sans": ["--mosaic-font-sans"],
  "--font-mono": ["--mosaic-font-mono"],
  "--border-radius-xs": ["--mosaic-radius-xs"],
  "--border-radius-sm": ["--mosaic-radius-sm"],
  "--border-radius-md": ["--mosaic-radius-md"],
  "--border-radius-lg": ["--mosaic-radius-lg"],
  "--border-radius-xl": ["--mosaic-radius-xl"],
  "--border-radius-full": ["--mosaic-radius-full"],
};

/** Origin Claude serves host fonts from; add it to `resourceDomains` to load `styles.css.fonts`. */
export const CLAUDE_HOST_FONT_ORIGIN = "https://assets.claude.ai";

const KNOWN = new Set<string>(MCP_STYLE_VARIABLE_KEYS);

/** Reads `hostContext.styles`; unknown keys and non-string values are dropped. */
export function readHostStyles(raw: unknown): HostStyles | undefined {
  if (raw === null || typeof raw !== "object") return undefined;
  const styles = (raw as Record<string, unknown>).styles;
  if (styles === null || typeof styles !== "object") return undefined;
  const s = styles as { variables?: unknown; css?: unknown };
  const variables: HostStyles["variables"] = {};
  if (s.variables !== null && typeof s.variables === "object") {
    for (const [k, v] of Object.entries(s.variables as Record<string, unknown>)) {
      if (KNOWN.has(k) && typeof v === "string") variables[k as McpStyleVariableKey] = v;
    }
  }
  const css = s.css !== null && typeof s.css === "object" ? (s.css as { fonts?: unknown }) : {};
  return { variables, fonts: typeof css.fonts === "string" ? css.fonts : undefined };
}

const applied = new WeakMap<HTMLElement, string[]>();

/**
 * Writes the host variables on `root`, and the mosaic-tokens custom properties they drive.
 * Variables a previous call set and this one no longer carries are cleared; `undefined` clears
 * all. Variables the host never passed are not written, so mosaic-tokens defaults remain.
 */
export function applyHostStyleVariables(styles: HostStyles | undefined, root: HTMLElement): void {
  for (const name of applied.get(root) ?? []) root.style.removeProperty(name);
  const written: string[] = [];
  for (const [host, value] of Object.entries(styles?.variables ?? {})) {
    root.style.setProperty(host, value);
    written.push(host);
    for (const target of HOST_TO_MOSAIC_TOKENS[host as McpStyleVariableKey] ?? []) {
      root.style.setProperty(target, value);
      written.push(target);
    }
  }
  applied.set(root, written);
}

const FONT_ATTR = "data-mosaic-host-fonts";

/** Injects `styles.css.fonts` as one `<style>` in `<head>`; replaced on change, removed when absent. */
export function applyHostFonts(css: string | undefined, doc: Document): void {
  const existing = doc.head.querySelector(`style[${FONT_ATTR}]`);
  if (css === undefined) {
    existing?.remove();
    return;
  }
  const el = existing ?? doc.head.appendChild(doc.createElement("style"));
  el.setAttribute(FONT_ATTR, "");
  el.textContent = css;
}

/** Claude transparent theming: html and body backgrounds are explicitly `transparent`. */
export function applyTransparentBackground(doc: Document): void {
  doc.documentElement.style.background = "transparent";
  doc.body.style.background = "transparent";
}
