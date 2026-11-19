/**
 * The theme parser moved to `@vantageos/mosaic-tokens`, where its full suite lives
 * (`packages/mosaic-tokens/src/__tests__/theme.test.ts`). This file proves mosaic re-exports the SAME
 * objects, on its internal module and on the public `server/config-view` subpath, and that the
 * re-export parses and refuses through the token package.
 */
import * as tokens from "@vantageos/mosaic-tokens";
import { describe, expect, it } from "vitest";
import * as configView from "../server/config-view";
import * as theme from "./theme";

describe("mosaic re-exports the theme parser from @vantageos/mosaic-tokens", () => {
  it("the internal module re-exports the identical objects", () => {
    expect(theme.parseThemeDocument).toBe(tokens.parseThemeDocument);
    expect(theme.ThemeError).toBe(tokens.ThemeError);
    expect(theme.themeToCss).toBe(tokens.themeToCss);
    expect(theme.THEME_TOKEN_NAMES).toBe(tokens.THEME_TOKEN_NAMES);
  });

  it("the server/config-view subpath re-exports the identical objects", () => {
    expect(configView.parseThemeDocument).toBe(tokens.parseThemeDocument);
    expect(configView.ThemeError).toBe(tokens.ThemeError);
  });

  it("parses a valid document and refuses an unknown token through the re-export", () => {
    const doc = { schemaVersion: 1, light: { "--mosaic-radius-md": "1px" } };
    expect(theme.parseThemeDocument(doc)).toEqual(doc);
    expect(() =>
      configView.parseThemeDocument({ schemaVersion: 1, light: { "--mosaic-color-nope": "#fff" } }),
    ).toThrow(/unknown token --mosaic-color-nope/);
  });
});
