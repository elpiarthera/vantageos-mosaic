import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { MarkdownRenderer } from "./MarkdownRenderer";
import corpus from "./eval-corpus.json";

describe("MarkdownRenderer — eval-corpus", () => {
  it("happy: renders markdown as HTML with article role", () => {
    const c = corpus[0];
    if (!c) throw new Error("corpus[0] missing");
    render(<MarkdownRenderer {...c.input} />);
    const article = screen.getByRole("article");
    expect(article).toBeTruthy();
    expect(article.innerHTML).toContain("<strong>bold</strong>");
  });

  it("edge: renders empty article without error", () => {
    const c = corpus[1];
    if (!c) throw new Error("corpus[1] missing");
    render(<MarkdownRenderer {...c.input} />);
    const article = screen.getByRole("article");
    expect(article).toBeTruthy();
  });

  it("failure: renders error fallback alert for invalid props", () => {
    const c = corpus[2];
    if (!c) throw new Error("corpus[2] missing");
    render(<MarkdownRenderer {...c.input} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("MarkdownRenderer: invalid props");
  });
});

describe("MarkdownRenderer — unit", () => {
  it("sets lang attribute to locale", () => {
    render(<MarkdownRenderer content="Hello" locale="fr" />);
    const article = screen.getByRole("article");
    expect(article.getAttribute("lang")).toBe("fr");
  });

  it("renders tooLong alert when content exceeds maxLength", () => {
    const longContent = "a".repeat(100);
    render(<MarkdownRenderer content={longContent} locale="en" maxLength={10} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Content exceeds maximum length.");
  });

  it("renders tooLong alert in French when locale is fr", () => {
    const longContent = "a".repeat(100);
    render(<MarkdownRenderer content={longContent} locale="fr" maxLength={10} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Le contenu dépasse la longueur maximale.");
  });

  it("strips HTML tags when allowHtml is false (default)", () => {
    render(<MarkdownRenderer content="<script>alert('xss')</script>Hello" locale="en" />);
    const article = screen.getByRole("article");
    expect(article.innerHTML).not.toContain("<script>");
  });

  it("has aria-label on article element", () => {
    render(<MarkdownRenderer content="Test" locale="en" />);
    const article = screen.getByRole("article");
    expect(article.getAttribute("aria-label")).toBe("Formatted content");
  });

  it("has French aria-label when locale is fr", () => {
    render(<MarkdownRenderer content="Test" locale="fr" />);
    const article = screen.getByRole("article");
    expect(article.getAttribute("aria-label")).toBe("Contenu formaté");
  });

  it("renders invalid props alert for missing required fields", () => {
    render(<MarkdownRenderer />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("MarkdownRenderer: invalid props");
  });

  it("preserves HTML tags when allowHtml is true", () => {
    render(<MarkdownRenderer content="<strong>Hello</strong>" locale="en" allowHtml={true} />);
    const article = screen.getByRole("article");
    expect(article.innerHTML).toContain("<strong>Hello</strong>");
  });

  it("renders FR invalid props alert when raw.locale=fr (i18n branch)", () => {
    // content missing → Zod fails; raw.locale="fr" → FR branch
    render(<MarkdownRenderer locale="fr" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/propriétés invalides/i);
  });
});
