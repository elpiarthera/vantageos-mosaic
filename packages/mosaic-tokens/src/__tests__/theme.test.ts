/**
 * Theme-document parser, ported from @vantageos/mosaic (src/theme/theme.test.ts) when the parser moved
 * into the zero-dependency token package. The ported cases are unchanged in substance; the block
 * "behaviour formerly given by the schema library" pins, message for message, what the previous
 * zod-based parser returned for the document-level problems, so the hand-written validation keeps
 * the same accept/refuse behaviour and the same texts servers log.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import contract from "../../naming-contract.json";
import * as barrel from "../index";
import { THEME_TOKEN_NAMES, ThemeError, parseThemeDocument, themeToCss } from "../theme";

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
  const tokensCss = readFileSync(resolve(__dirname, "../tokens.css"), "utf8");
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

function messagesOf(input: unknown): string[] {
  return issuesOf(input).map((i) => i.message);
}

describe("behaviour formerly given by the schema library (messages pinned to the previous parser)", () => {
  it.each([
    ["a string", "x", "string"],
    ["null", null, "null"],
    ["an array", [], "array"],
    ["a number", 3, "number"],
    ["undefined", undefined, "undefined"],
    ["NaN", Number.NaN, "NaN"],
  ])("refuses %s as the document", (_label, input, received) => {
    expect(issuesOf(input)).toEqual([
      { message: `Invalid input: expected object, received ${received}` },
    ]);
  });

  it("refuses an unknown top-level key, naming it", () => {
    expect(messagesOf({ schemaVersion: 1, light: { [RADIUS]: "1px" }, extra: 1 })).toEqual([
      'Unrecognized key: "extra"',
    ]);
  });

  it("names every unknown top-level key in one issue", () => {
    expect(messagesOf({ schemaVersion: 1, light: {}, extra: 1, other: 2 })).toEqual([
      'Unrecognized keys: "extra", "other"',
    ]);
  });

  it.each([
    ["2", 2],
    ["the string 1", "1"],
    ["missing", undefined],
  ])("refuses schemaVersion %s", (_label, v) => {
    const doc: Record<string, unknown> = { light: { [RADIUS]: "1px" } };
    if (v !== undefined) doc.schemaVersion = v;
    expect(messagesOf(doc)).toEqual(["schemaVersion: Invalid input: expected 1"]);
  });

  it("accepts a name of exactly 200 characters and refuses 201", () => {
    expect(() =>
      parseThemeDocument({ schemaVersion: 1, name: "x".repeat(200), light: {} }),
    ).not.toThrow();
    expect(messagesOf({ schemaVersion: 1, name: "x".repeat(201), light: {} })).toEqual([
      "name: Too big: expected string to have <=200 characters",
    ]);
  });

  it("refuses a name that is not a string", () => {
    expect(messagesOf({ schemaVersion: 1, name: 3, light: {} })).toEqual([
      "name: Invalid input: expected string, received number",
    ]);
  });

  it.each([
    ["a string", "x", "string"],
    ["an array", [], "array"],
    ["null", null, "null"],
    ["a Date", new Date(0), "Date"],
  ])("refuses light as %s, with its scope", (_label, v, received) => {
    expect(issuesOf({ schemaVersion: 1, light: v })).toEqual([
      { scope: "light", message: `light: Invalid input: expected record, received ${received}` },
    ]);
  });

  it("refuses dark as a non-object, with its scope", () => {
    expect(issuesOf({ schemaVersion: 1, light: { [RADIUS]: "1px" }, dark: null })).toEqual([
      { scope: "dark", message: "dark: Invalid input: expected record, received null" },
    ]);
  });

  it("an explicit undefined light/dark counts as absent", () => {
    expect(messagesOf({ schemaVersion: 1, light: undefined, dark: undefined })).toEqual([
      "a theme needs at least one of light or dark",
    ]);
  });

  it("accepts an empty light block (present, no tokens)", () => {
    expect(parseThemeDocument({ schemaVersion: 1, light: {} })).toEqual({
      schemaVersion: 1,
      light: {},
    });
  });

  it("two bad tokens in one document give two issues, in document order, scope and token set", () => {
    expect(
      issuesOf({ schemaVersion: 1, light: { "--mosaic-color-nope": "#fff", [COLOR]: "blue" } }),
    ).toEqual([
      {
        scope: "light",
        token: "--mosaic-color-nope",
        message: "unknown token --mosaic-color-nope",
      },
      {
        scope: "light",
        token: COLOR,
        message: `${COLOR}: not a colour (oklch, oklab, rgb, hsl, #hex or var(--mosaic-…))`,
      },
    ]);
  });

  it("collects every document-level issue, in field order, unknown keys last", () => {
    expect(issuesOf({ schemaVersion: 2, name: 4, light: "x", extra: 1 })).toEqual([
      { message: "schemaVersion: Invalid input: expected 1" },
      { message: "name: Invalid input: expected string, received number" },
      { scope: "light", message: "light: Invalid input: expected record, received string" },
      { message: 'Unrecognized key: "extra"' },
    ]);
  });

  it("does not add the light-or-dark issue when the document already has another problem", () => {
    expect(messagesOf({ schemaVersion: 2 })).toEqual(["schemaVersion: Invalid input: expected 1"]);
  });

  it("the ThemeError message joins every issue message", () => {
    try {
      parseThemeDocument({ schemaVersion: 2, extra: 1 });
      throw new Error("expected a throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ThemeError);
      expect((e as ThemeError).name).toBe("ThemeError");
      expect((e as ThemeError).message).toBe(
        'invalid theme: schemaVersion: Invalid input: expected 1; Unrecognized key: "extra"',
      );
    }
  });

  it("refuses a __proto__ token instead of dropping it silently", () => {
    const doc = JSON.parse('{"schemaVersion":1,"light":{"__proto__":"x"}}');
    expect(issuesOf(doc)).toEqual([
      { scope: "light", token: "__proto__", message: "unknown token __proto__" },
    ]);
  });

  it("returns a copy, never the caller's objects", () => {
    const light = { [RADIUS]: "1px" };
    const doc = { schemaVersion: 1, light };
    const out = parseThemeDocument(doc);
    expect(out).not.toBe(doc);
    expect(out.light).not.toBe(light);
    expect(out).toEqual(doc);
  });
});

describe("package barrel", () => {
  it("exports the theme API from @vantageos/mosaic-tokens", () => {
    expect(barrel.parseThemeDocument).toBe(parseThemeDocument);
    expect(barrel.ThemeError).toBe(ThemeError);
    expect(barrel.themeToCss).toBe(themeToCss);
    expect(barrel.THEME_TOKEN_NAMES).toBe(THEME_TOKEN_NAMES);
  });
});

describe("plain-object detection for a token block", () => {
  it("accepts a null-prototype block", () => {
    const light = Object.create(null) as Record<string, string>;
    light[RADIUS] = "1px";
    expect(parseThemeDocument({ schemaVersion: 1, light }).light).toEqual({ [RADIUS]: "1px" });
  });
  it("refuses a class instance and a Map, naming their type", () => {
    class Tokens {}
    expect(messagesOf({ schemaVersion: 1, light: new Tokens() })).toEqual([
      "light: Invalid input: expected record, received Tokens",
    ]);
    expect(messagesOf({ schemaVersion: 1, dark: new Map() })).toEqual([
      "dark: Invalid input: expected record, received Map",
    ]);
  });
});
