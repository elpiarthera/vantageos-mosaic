import { marked } from "marked";
import { describe, expect, it } from "vitest";
import { mdEscape } from "../components/shared/markdown";
import { MosaicSecretLeakError, createMosaicToolResult } from "./create-mosaic-resource";

const tok = (token: string, title: string) => ({
  token,
  title,
  warningMessage: "Copy it now",
  copyLabel: "Copy",
  closeLabel: "Close",
});

// Eta (#75 verdict): the guard compared exact bytes, so an "ABCD" echo of "abcd" slipped through.
// The comparison is case-folded and NFKC-normalised on both sides. Accepted cost: a short secret
// can now also collide with differently-cased text and refuse loudly (documented in the JSDoc).
describe("the secret guard compares case-folded, NFKC-normalised text", () => {
  it("an upper-case echo of a lower-case secret is caught", () => {
    expect(() =>
      createMosaicToolResult("TokenDisplayOnceModal", tok("abcd", "Code ABCD"), "en"),
    ).toThrow(MosaicSecretLeakError);
  });

  it("a lower-case echo of a mixed-case secret is caught", () => {
    expect(() =>
      createMosaicToolResult("TokenDisplayOnceModal", tok("Ab12Cd", "code ab12cd"), "fr"),
    ).toThrow(MosaicSecretLeakError);
  });

  it("a full-width (compatibility) echo is caught after NFKC", () => {
    expect(() =>
      createMosaicToolResult("TokenDisplayOnceModal", tok("A1B2", "Code Ａ１Ｂ２"), "en"),
    ).toThrow(MosaicSecretLeakError);
  });

  it("a non-echoing title still passes, and the secret stays out of content[]", () => {
    const r = createMosaicToolResult("TokenDisplayOnceModal", tok("abcd", "Deploy key"), "en");
    expect(JSON.stringify(r.content).toLowerCase()).not.toContain("abcd");
  });
});

// mdEscape also breaks GFM autolink literals; remove either breaker and a bare URL goes live.
describe("mdEscape keeps bare URLs from becoming live links", () => {
  const out = (s: string) => marked.parse(mdEscape(s), { async: false }) as string;

  it("a bare www. host is not auto-linked", () => {
    expect(out("see www.attacker.example/x")).not.toMatch(/<a /);
    expect(out("see www.attacker.example/x")).toContain("www.attacker.example/x");
  });

  it("a bare http(s):// URL is not auto-linked", () => {
    expect(out("see https://attacker.example/x and http://a.example")).not.toMatch(/<a /);
  });

  it("the text stays readable", () => {
    expect(mdEscape("www.example.com")).toBe("www\\.example.com");
    expect(mdEscape("https://a.example")).toBe("https:\\/\\/a.example");
  });
});
