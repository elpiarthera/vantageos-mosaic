import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readHostContext } from "./host-context.js";
import {
  CLAUDE_HOST_FONT_ORIGIN,
  HOST_TO_MOSAIC_TOKENS,
  MCP_STYLE_VARIABLE_KEYS,
  applyHostFonts,
  applyHostStyleVariables,
  applyTransparentBackground,
  readHostStyles,
} from "./style-variables.js";

// Spec: MCP Apps 2026-01-26 ext-apps-spec.mdx
//   l.547-555  HostContext.styles = { variables?: Record<McpUiStyleVariableKey, string|undefined>,
//                                      css?: { fonts?: string } }
//   l.799-888  McpUiStyleVariableKey (76 keys)
//   l.895-905  Views fall back on their own defaults for unspecified variables.
// Claude transparent-theming page: fonts need https://assets.claude.ai in resourceDomains;
//   html and body backgrounds are set to transparent.

const tokensCss = readFileSync(
  join(import.meta.dirname, "../../../mosaic-tokens/src/tokens.css"),
  "utf8",
);

describe("host style variables bridge (H02)", () => {
  it("lists the 76 standardized keys from the spec, all CSS custom properties, no duplicates", () => {
    expect(MCP_STYLE_VARIABLE_KEYS).toHaveLength(76);
    expect(new Set(MCP_STYLE_VARIABLE_KEYS).size).toBe(76);
    expect(MCP_STYLE_VARIABLE_KEYS.every((k) => k.startsWith("--"))).toBe(true);
  });

  it("reads styles.variables (known keys, string values only) and styles.css.fonts", () => {
    const s = readHostStyles({
      styles: {
        variables: {
          "--color-background-primary": "#fff",
          "--color-text-primary": undefined,
          "--not-in-spec": "x",
          "--font-sans": 12,
        },
        css: { fonts: "@font-face{font-family:X}" },
      },
    });
    expect(s?.variables).toEqual({ "--color-background-primary": "#fff" });
    expect(s?.fonts).toBe("@font-face{font-family:X}");
  });

  it("is absent-safe: no styles, or a non-object, reads as undefined", () => {
    for (const raw of [undefined, null, {}, { styles: null }, { styles: "x" }]) {
      expect(readHostStyles(raw)).toBeUndefined();
    }
  });

  it("maps host variables onto mosaic-tokens custom properties (host value wins)", () => {
    const el = document.createElement("div");
    applyHostStyleVariables(
      readHostStyles({
        styles: { variables: { "--color-background-primary": "rgb(1, 2, 3)", "--font-sans": "Foo" } },
      }),
      el,
    );
    expect(el.style.getPropertyValue("--color-background-primary")).toBe("rgb(1, 2, 3)");
    expect(el.style.getPropertyValue("--mosaic-color-background")).toBe("rgb(1, 2, 3)");
    expect(el.style.getPropertyValue("--mosaic-font-sans")).toBe("Foo");
  });

  it("leaves mosaic tokens untouched for variables the host does not pass (fallback = mosaic default)", () => {
    const el = document.createElement("div");
    applyHostStyleVariables(readHostStyles({ styles: { variables: { "--font-sans": "Foo" } } }), el);
    expect(el.style.getPropertyValue("--mosaic-color-background")).toBe("");
  });

  it("clears what a previous call set when a later host context drops the variable", () => {
    const el = document.createElement("div");
    applyHostStyleVariables(
      readHostStyles({ styles: { variables: { "--color-background-primary": "red" } } }),
      el,
    );
    applyHostStyleVariables(readHostStyles({ styles: { variables: {} } }), el);
    expect(el.style.getPropertyValue("--mosaic-color-background")).toBe("");
    applyHostStyleVariables(undefined, el);
    expect(el.style.getPropertyValue("--color-background-primary")).toBe("");
  });

  it("every bridge source is a spec key and every target exists in mosaic-tokens tokens.css", () => {
    const entries = Object.entries(HOST_TO_MOSAIC_TOKENS);
    expect(entries.length).toBeGreaterThan(10);
    for (const [host, targets] of entries) {
      expect(MCP_STYLE_VARIABLE_KEYS).toContain(host);
      for (const target of targets ?? []) {
        expect(tokensCss).toContain(`${target}:`);
      }
    }
  });

  it("injects host fonts once, replaces them on change and removes them when absent", () => {
    applyHostFonts("@font-face{font-family:A}", document);
    applyHostFonts("@font-face{font-family:B}", document);
    const styles = document.head.querySelectorAll("style[data-mosaic-host-fonts]");
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toBe("@font-face{font-family:B}");
    applyHostFonts(undefined, document);
    expect(document.head.querySelectorAll("style[data-mosaic-host-fonts]")).toHaveLength(0);
  });

  it("names the Claude font origin needed in resourceDomains", () => {
    expect(CLAUDE_HOST_FONT_ORIGIN).toBe("https://assets.claude.ai");
  });

  it("sets html and body backgrounds to transparent", () => {
    applyTransparentBackground(document);
    expect(document.documentElement.style.background).toBe("transparent");
    expect(document.body.style.background).toBe("transparent");
  });

  it("is surfaced on the host context", () => {
    const c = readHostContext({ styles: { variables: { "--font-mono": "M" } } });
    expect(c.styles?.variables).toEqual({ "--font-mono": "M" });
    expect(readHostContext({}).styles).toBeUndefined();
  });
});
