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
  it('writes :root for light and [data-theme="dark"] for dark', () => {
    const css = themeToCss(
      parseThemeDocument({
        schemaVersion: 1,
        light: { [RADIUS]: "1px" },
        dark: { [COLOR]: "#fff" },
      }),
    );
    expect(css).toBe(`:root{${RADIUS}:1px;}[data-theme="dark"]{${COLOR}:#fff;}`);
  });

  it("omits a block that has no tokens", () => {
    expect(themeToCss({ schemaVersion: 1, dark: { [COLOR]: "#fff" } })).toBe(
      `[data-theme="dark"]{${COLOR}:#fff;}`,
    );
  });
});
