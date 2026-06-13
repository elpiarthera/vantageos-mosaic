/**
 * MarkdownRenderer — React 19 runtime tests.
 *
 * Covers: Zod schema validation, markdown parsing, a11y landmarks,
 * tooLong guard, allowHtml toggle, FR/EN i18n branches, invalid props fallback.
 * 9 tests — matches acceptance criteria.
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { MarkdownRendererPropsSchema } from "../../../../../components/artifacts/MarkdownRenderer.schema.js";
import { MarkdownRenderer } from "../MarkdownRenderer.js";

afterEach(() => {
  cleanup();
});

// ─── 1. Zod schema validation ─────────────────────────────────────────────────

describe("MarkdownRenderer — schema", () => {
  it("accepts valid minimal props", () => {
    const result = MarkdownRendererPropsSchema.safeParse({ content: "Hello", locale: "en" });
    expect(result.success).toBe(true);
  });

  it("rejects missing content", () => {
    const result = MarkdownRendererPropsSchema.safeParse({ locale: "en" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown locale", () => {
    const result = MarkdownRendererPropsSchema.safeParse({ content: "Hi", locale: "de" });
    expect(result.success).toBe(false);
  });
});

// ─── 2. Markdown parsing ──────────────────────────────────────────────────────

describe("MarkdownRenderer — markdown parsing", () => {
  it("renders markdown as HTML with article landmark", () => {
    render(<MarkdownRenderer content="# Hello\n\nThis is **bold** text." locale="fr" />);
    const article = screen.getByRole("article");
    expect(article).toBeTruthy();
    expect(article.innerHTML).toContain("<strong>bold</strong>");
  });

  it("renders empty content without error", () => {
    render(<MarkdownRenderer content="" locale="en" allowHtml={false} />);
    const article = screen.getByRole("article");
    expect(article).toBeTruthy();
  });
});

// ─── 3. Accessibility ─────────────────────────────────────────────────────────

describe("MarkdownRenderer — a11y", () => {
  it("has EN aria-label on article element", () => {
    render(<MarkdownRenderer content="Test" locale="en" />);
    const article = screen.getByRole("article");
    expect(article.getAttribute("aria-label")).toBe("Rendered Markdown content");
  });

  it("has FR aria-label when locale is fr", () => {
    render(<MarkdownRenderer content="Test" locale="fr" />);
    const article = screen.getByRole("article");
    expect(article.getAttribute("aria-label")).toBe("Contenu Markdown rendu");
  });

  it("sets lang attribute to locale", () => {
    render(<MarkdownRenderer content="Hello" locale="fr" />);
    const article = screen.getByRole("article");
    expect(article.getAttribute("lang")).toBe("fr");
  });
});

// ─── 4. tooLong guard ────────────────────────────────────────────────────────

describe("MarkdownRenderer — tooLong", () => {
  it("renders tooLong alert (EN) when content exceeds maxLength", () => {
    const longContent = "a".repeat(100);
    render(<MarkdownRenderer content={longContent} locale="en" maxLength={10} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Content exceeds maximum length");
  });

  it("renders tooLong alert (FR) when locale is fr", () => {
    const longContent = "a".repeat(100);
    render(<MarkdownRenderer content={longContent} locale="fr" maxLength={10} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Le contenu dépasse la longueur maximale");
  });
});

// ─── 5. allowHtml toggle ─────────────────────────────────────────────────────

describe("MarkdownRenderer — allowHtml", () => {
  it("strips HTML tags when allowHtml is false (default)", () => {
    render(<MarkdownRenderer content="<script>alert('xss')</script>Hello" locale="en" />);
    const article = screen.getByRole("article");
    expect(article.innerHTML).not.toContain("<script>");
  });

  it("preserves HTML tags when allowHtml is true", () => {
    render(
      <MarkdownRenderer content="<strong>Hello</strong>" locale="en" allowHtml={true} />,
    );
    const article = screen.getByRole("article");
    expect(article.innerHTML).toContain("<strong>Hello</strong>");
  });
});

// ─── 6. Invalid props fallback ────────────────────────────────────────────────

describe("MarkdownRenderer — invalid props fallback", () => {
  it("renders EN error fallback on missing required fields", () => {
    render(<MarkdownRenderer />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("MarkdownRenderer: invalid props");
  });

  it("renders FR error fallback when raw.locale=fr", () => {
    render(<MarkdownRenderer locale="fr" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });

  it("renders error fallback for non-string content", () => {
    render(<MarkdownRenderer content={42} locale="unknown" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("MarkdownRenderer: invalid props");
  });
});
