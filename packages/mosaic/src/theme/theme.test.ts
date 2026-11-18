import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import contract from "../../../mosaic-tokens/naming-contract.json";
import { THEME_TOKEN_NAMES, ThemeError, parseThemeDocument, themeToCss } from "./theme";

const COLOR = "--mosaic-color-accent";
const RADIUS = "--mosaic-radius-md";

function issuesOf(input: unknown): { token?: string; message: string }[] {
  try {
    parseThemeDocument(input);
  } catch (e) {
    expect(e).toBeInstanceOf(ThemeError);
    return (e as ThemeError).issues;
  }
  throw new Error("expected parseThemeDocument to throw");
}

describe("parseThemeDocument", () => {
  it("accepts a light + dark document and returns it", () => {
    const doc = {
      schemaVersion: 1,
      name: "Acme",
      light: { [COLOR]: "oklch(0.6 0.2 250)", [RADIUS]: "0.5rem" },
      dark: { [COLOR]: "#abc" },
    };
    expect(parseThemeDocument(doc)).toEqual(doc);
  });

  it("derives the allowed token set from the naming contract (no hand-typed list)", () => {
    expect([...THEME_TOKEN_NAMES]).toEqual(contract.names);
  });

  it("accepts every colour form", () => {
    for (const v of [
      "oklch(0.6 0.2 250 / 0.5)",
      "oklab(0.6 0.1 0.1)",
      "rgb(1, 2, 3)",
      "rgba(1,2,3,0.5)",
      "hsl(10 20% 30%)",
      "hsla(10, 20%, 30%, 0.5)",
      "#abc",
      "#abcd",
      "#aabbcc",
      "#aabbccdd",
      "var(--mosaic-color-primary)",
    ]) {
      expect(
        () => parseThemeDocument({ schemaVersion: 1, light: { [COLOR]: v } }),
        v,
      ).not.toThrow();
    }
  });

  it("refuses an unknown token, naming it", () => {
    const issues = issuesOf({ schemaVersion: 1, light: { "--mosaic-color-nope": "#fff" } });
    expect(issues.map((i) => i.token)).toContain("--mosaic-color-nope");
    expect(issues[0]?.message).toContain("unknown token --mosaic-color-nope");
  });

  it.each([
    "red; background: url(x)",
    "a{b}",
    "</style><script>",
    "x\\y",
    "url(http://e.com/a.png)",
    "URL(x)",
    "expression(alert(1))",
    "@import x",
    "",
    "x".repeat(201),
  ])("refuses an injection or invalid value %j, naming the token", (v) => {
    const issues = issuesOf({ schemaVersion: 1, dark: { [RADIUS]: v } });
    expect(issues[0]?.token).toBe(RADIUS);
    expect(issues[0]?.message).toContain(RADIUS);
  });

  it("refuses a non-string value, naming the token", () => {
    expect(issuesOf({ schemaVersion: 1, light: { [RADIUS]: 4 } })[0]?.token).toBe(RADIUS);
  });

  it.each(["blue", "oklch(", "#12", "#ggg", "rgb(1,2,3", "var(--other)", "calc(1px)"])(
    "refuses the bad colour %j",
    (v) => {
      const issues = issuesOf({ schemaVersion: 1, light: { [COLOR]: v } });
      expect(issues[0]?.token).toBe(COLOR);
    },
  );

  it("lists EVERY bad token, not just the first, across light and dark", () => {
    const issues = issuesOf({
      schemaVersion: 1,
      light: { "--mosaic-color-nope": "#fff", [COLOR]: "blue", [RADIUS]: "ok" },
      dark: { [RADIUS]: "a;b" },
    });
    expect(issues.map((i) => i.token).sort()).toEqual(
      ["--mosaic-color-nope", COLOR, RADIUS].sort(),
    );
  });

  it("refuses a document with neither light nor dark", () => {
    expect(() => parseThemeDocument({ schemaVersion: 1 })).toThrow(ThemeError);
  });

  it("refuses a wrong schemaVersion, a non-object, and an unknown top-level key", () => {
    expect(() => parseThemeDocument({ schemaVersion: 2, light: { [RADIUS]: "1px" } })).toThrow(
      ThemeError,
    );
    expect(() => parseThemeDocument("x")).toThrow(ThemeError);
    expect(() => parseThemeDocument(null)).toThrow(ThemeError);
    expect(() =>
      parseThemeDocument({ schemaVersion: 1, light: { [RADIUS]: "1px" }, extra: 1 }),
    ).toThrow(ThemeError);
  });
});

describe("themeToCss", () => {
  it('writes light scoped off the dark scheme and dark on :root[data-theme="dark"]', () => {
    const css = themeToCss(
      parseThemeDocument({
        schemaVersion: 1,
        light: { [RADIUS]: "1px" },
        dark: { [COLOR]: "#fff" },
      }),
    );
    expect(css).toBe(
      `:root:not([data-theme="dark"]){${RADIUS}:1px;}:root[data-theme="dark"]{${COLOR}:#fff;}`,
    );
  });

  it("omits a block that has no tokens", () => {
    expect(themeToCss({ schemaVersion: 1, dark: { [COLOR]: "#fff" } })).toBe(
      `:root[data-theme="dark"]{${COLOR}:#fff;}`,
    );
  });
});

describe("themeToCss selectors: a block never matches while the other scheme is active", () => {
  it('scopes light to :root:not([data-theme="dark"]) and dark to :root[data-theme="dark"]', () => {
    const css = themeToCss(
      parseThemeDocument({
        schemaVersion: 1,
        light: { [RADIUS]: "1px" },
        dark: { [COLOR]: "#fff" },
      }),
    );
    expect(css).toBe(
      `:root:not([data-theme="dark"]){${RADIUS}:1px;}:root[data-theme="dark"]{${COLOR}:#fff;}`,
    );
  });
});

const BG = "--mosaic-color-background";
describe("themeToCss cascade against the real tokens.css (jsdom)", () => {
  const tokensCss = readFileSync(
    resolve(__dirname, "../../../mosaic-tokens/src/tokens.css"),
    "utf8",
  );
  const DARK_DEFAULT = "oklch(0.145 0 0)"; // tokens.css [data-theme="dark"] --mosaic-color-background
  const THEME_ACCENT = "#112233";
  const THEME_DARK_ACCENT = "#aabbcc";

  /** Applies tokens.css then the theme `<style>` LAST (as ConfigViewApp does), reads the computed token. */
  function computed(theme: Parameters<typeof themeToCss>[0], dataTheme: string | null): string {
    document.head.innerHTML = "";
    const tok = document.createElement("style");
    tok.textContent = tokensCss;
    const th = document.createElement("style");
    th.textContent = themeToCss(theme);
    document.head.append(tok, th);
    if (dataTheme === null) document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", dataTheme);
    return getComputedStyle(document.documentElement).getPropertyValue(BG).trim();
  }
  const lightOnly = { schemaVersion: 1 as const, light: { [BG]: THEME_ACCENT } };
  const both = { ...lightOnly, dark: { [BG]: THEME_DARK_ACCENT } };

  it("positive control: the instrument resolves a token from tokens.css", () => {
    expect(computed({ schemaVersion: 1, light: { [RADIUS]: "1px" } }, "dark")).not.toBe(
      THEME_ACCENT,
    );
    expect(computed(lightOnly, "light")).toBe(THEME_ACCENT);
  });
  it("light host + light theme -> light override", () => {
    expect(computed(lightOnly, "light")).toBe(THEME_ACCENT);
  });
  it("no data-theme attribute -> light override", () => {
    expect(computed(lightOnly, null)).toBe(THEME_ACCENT);
  });
  it("dark host + light-only theme -> mosaic dark default untouched", () => {
    expect(computed(lightOnly, "dark")).toBe(DARK_DEFAULT);
  });
  it("dark host + dark block -> dark override", () => {
    expect(computed(both, "dark")).toBe(THEME_DARK_ACCENT);
  });
});
