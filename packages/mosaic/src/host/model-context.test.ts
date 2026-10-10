import { describe, expect, it } from "vitest";
import { readHostContext } from "./host-context.js";
import {
  buildModelContext,
  readModelContextState,
  selectionModelContext,
  structuredContentBlock,
  textBlock,
} from "./model-context.js";

// Spec: openai-mcp-ext-spec.md "ui/update-model-context Extensions"
//   l.1022 `_meta["openai/title"]` non-empty string on text and image blocks
//   l.1042 `_meta["openai/thumbnail"]` an MCP.Icon on text blocks (not yet supported on iOS, l.1046)
//   l.1070 `annotations.audience: ["assistant"]` hides a block from the user
//   l.1072 serialized structuredContent in a text block SHOULD set audience ["assistant"]
//   l.936-962 idempotent: each call replaces the previous context of the same app instance
//   l.962-975 `hostContext["openai/modelContext"]` = { updateId, content?, structuredContent? } | null
describe("typed model-context blocks (H03)", () => {
  it("builds a plain text block with no _meta and no annotations", () => {
    expect(textBlock("3 rows selected")).toEqual({ type: "text", text: "3 rows selected" });
  });

  it("adds openai/title and openai/thumbnail under _meta", () => {
    expect(
      textBlock("Selected: agent dial", {
        title: "Agent dial",
        thumbnail: { src: "https://example.com/dial.png" },
      }),
    ).toEqual({
      type: "text",
      text: "Selected: agent dial",
      _meta: {
        "openai/title": "Agent dial",
        "openai/thumbnail": { src: "https://example.com/dial.png" },
      },
    });
  });

  it("marks background context with annotations.audience [assistant]", () => {
    expect(textBlock("Current part: hex-bolt", { background: true })).toEqual({
      type: "text",
      text: "Current part: hex-bolt",
      annotations: { audience: ["assistant"] },
    });
  });

  it("rejects an empty title and a thumbnail without src", () => {
    expect(() => textBlock("x", { title: "" })).toThrow(/title/);
    expect(() => textBlock("x", { thumbnail: { src: "" } })).toThrow(/thumbnail/);
  });

  it("serializes structuredContent into an assistant-only text block", () => {
    const b = structuredContentBlock({ count: 2 });
    expect(b).toEqual({
      type: "text",
      text: '{"count":2}',
      annotations: { audience: ["assistant"] },
    });
  });

  it("assembles ui/update-model-context params (blocks + structuredContent)", () => {
    const p = buildModelContext({
      blocks: [textBlock("a")],
      structuredContent: { n: 1 },
    });
    expect(p).toEqual({ content: [{ type: "text", text: "a" }], structuredContent: { n: 1 } });
    expect(buildModelContext({})).toEqual({});
  });

  it("reads hostContext['openai/modelContext']: state, cleared (null) and absent (undefined)", () => {
    expect(
      readModelContextState({
        "openai/modelContext": { updateId: "u1", content: [{ type: "text", text: "x" }] },
      }),
    ).toEqual({ updateId: "u1", content: [{ type: "text", text: "x" }] });
    expect(readModelContextState({ "openai/modelContext": null })).toBeNull();
    expect(readModelContextState({})).toBeUndefined();
    expect(readModelContextState({ "openai/modelContext": { updateId: "" } })).toBeUndefined();
    expect(readModelContextState({ "openai/modelContext": "x" })).toBeUndefined();
  });

  it("is surfaced on the host context, additive", () => {
    expect(readHostContext({ "openai/modelContext": null }).modelContext).toBeNull();
    expect(readHostContext({}).modelContext).toBeUndefined();
  });

  it("describes a table selection as one titled block, FR and EN", () => {
    const cols = [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
    ];
    const rows = [
      { id: 1, name: "Alpha" },
      { id: 2, name: "Beta" },
    ];
    const en = selectionModelContext(rows, cols, "en");
    expect(en.content?.[0]).toMatchObject({
      type: "text",
      _meta: { "openai/title": "2 rows selected" },
    });
    expect(String(en.content?.[0]?.text)).toContain("Alpha");
    expect(String(en.content?.[0]?.text)).toContain("ID: 2");
    const fr = selectionModelContext(rows, cols, "fr");
    expect(fr.content?.[0]).toMatchObject({ _meta: { "openai/title": "2 lignes sélectionnées" } });
  });

  it("describes an empty selection as an empty context that replaces the previous one", () => {
    expect(selectionModelContext([], [{ key: "id", header: "ID" }], "en")).toEqual({
      content: [],
    });
  });
});
