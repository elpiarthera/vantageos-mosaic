import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Alert } from "../../../runtimes/react/components/confirmation/Alert";
import { AlertPropsSchema, validateAlertProps } from "../Alert.schema";

afterEach(() => {
  cleanup();
});

// ─── Schema / Zod validation ────────────────────────────────────────────────

describe("Alert schema validation", () => {
  it("parses valid success props", () => {
    const result = validateAlertProps({ variant: "success", title: "Done!" });
    expect(result.variant).toBe("success");
    expect(result.dismissible).toBe(false);
    expect(result.locale).toBe("en");
  });

  it("parses valid error props", () => {
    const result = validateAlertProps({ variant: "error", title: "Something went wrong" });
    expect(result.variant).toBe("error");
  });

  it("parses valid warning props with description", () => {
    const result = validateAlertProps({
      variant: "warning",
      title: "Warning",
      description: "Please check your input.",
      dismissible: true,
      locale: "fr",
    });
    expect(result.dismissible).toBe(true);
    expect(result.locale).toBe("fr");
    expect(result.description).toBe("Please check your input.");
  });

  it("throws on missing variant", () => {
    expect(() => validateAlertProps({ title: "hi" })).toThrow();
  });

  it("throws on empty title", () => {
    expect(() => validateAlertProps({ variant: "info", title: "" })).toThrow();
  });

  it("throws on invalid variant", () => {
    expect(() => validateAlertProps({ variant: "critical", title: "Hi" })).toThrow();
  });

  it("exports AlertPropsSchema as ZodObject", () => {
    expect(typeof AlertPropsSchema.parse).toBe("function");
  });
});

// ─── Render — 4 variants ────────────────────────────────────────────────────

describe("Alert render — variants", () => {
  it("renders success variant with correct classes", () => {
    render(<Alert variant="success" title="Operation successful" />);
    expect(screen.getByText("Operation successful")).toBeTruthy();
    const container = screen.getByRole("status");
    expect(container.className).toContain("green");
  });

  it("renders error variant with correct classes", () => {
    render(<Alert variant="error" title="An error occurred" />);
    expect(screen.getByText("An error occurred")).toBeTruthy();
    const container = screen.getByRole("alert");
    expect(container.className).toContain("red");
  });

  it("renders info variant with correct classes", () => {
    render(<Alert variant="info" title="FYI: system update tonight" />);
    expect(screen.getByText("FYI: system update tonight")).toBeTruthy();
    const container = screen.getByRole("status");
    expect(container.className).toContain("blue");
  });

  it("renders warning variant with correct classes", () => {
    render(<Alert variant="warning" title="Low disk space" />);
    expect(screen.getByText("Low disk space")).toBeTruthy();
    const container = screen.getByRole("status");
    expect(container.className).toContain("amber");
  });
});

// ─── WCAG-AA role per variant ────────────────────────────────────────────────

describe("Alert ARIA role — WCAG-AA", () => {
  it("error variant → role=alert + aria-live=assertive", () => {
    render(<Alert variant="error" title="Error" />);
    const el = screen.getByRole("alert");
    expect(el.getAttribute("aria-live")).toBe("assertive");
    expect(el.getAttribute("aria-atomic")).toBe("true");
  });

  it("success variant → role=status + aria-live=polite", () => {
    render(<Alert variant="success" title="Success" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("aria-atomic")).toBe("true");
  });

  it("info variant → role=status + aria-live=polite", () => {
    render(<Alert variant="info" title="Info" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
  });

  it("warning variant → role=status + aria-live=polite", () => {
    render(<Alert variant="warning" title="Warning" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
  });
});

// ─── description prop ────────────────────────────────────────────────────────

describe("Alert description", () => {
  it("renders description when provided", () => {
    render(<Alert variant="info" title="Info" description="Some details here." />);
    expect(screen.getByText("Some details here.")).toBeTruthy();
  });

  it("does not render description element when omitted", () => {
    render(<Alert variant="info" title="Info" />);
    expect(screen.queryByText("Some details here.")).toBeNull();
  });
});

// ─── dismissible prop ────────────────────────────────────────────────────────

describe("Alert dismissible", () => {
  it("does NOT render dismiss button when dismissible=false (default)", () => {
    render(<Alert variant="info" title="Info" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders dismiss button when dismissible=true", () => {
    render(<Alert variant="info" title="Info" dismissible={true} onDismiss={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn).toBeTruthy();
  });

  it("dismiss button has accessible aria-label (EN)", () => {
    render(
      <Alert variant="success" title="Done" dismissible={true} onDismiss={() => {}} locale="en" />,
    );
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toBe("Dismiss alert");
  });

  it("dismiss button has accessible aria-label (FR)", () => {
    render(
      <Alert variant="success" title="Done" dismissible={true} onDismiss={() => {}} locale="fr" />,
    );
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toBe("Fermer l'alerte");
  });
});

// ─── onDismiss callback ──────────────────────────────────────────────────────

describe("Alert onDismiss", () => {
  it("calls onDismiss when dismiss button clicked", () => {
    const onDismiss = vi.fn();
    render(<Alert variant="warning" title="Watch out" dismissible={true} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("does not crash when dismissible=true but onDismiss is undefined", () => {
    render(<Alert variant="info" title="Info" dismissible={true} />);
    const btn = screen.getByRole("button");
    expect(() => fireEvent.click(btn)).not.toThrow();
  });
});

// ─── focus management post-dismiss ──────────────────────────────────────────

describe("Alert focus management", () => {
  it("dismiss button is keyboard-focusable", () => {
    render(<Alert variant="info" title="Info" dismissible={true} onDismiss={() => {}} />);
    const btn = screen.getByRole("button");
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });
});

// ─── Invalid props fallback ──────────────────────────────────────────────────

describe("Alert invalid props", () => {
  it("renders error span when variant is invalid", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Alert variant={"critical" as "error"} title="Oops" />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Alert");
    errorSpy.mockRestore();
  });

  it("renders FR error message when locale=fr and props invalid", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Alert variant={"critical" as "error"} title="Oops" locale="fr" />);
    expect(screen.getByRole("alert").textContent).toContain("Alert");
    errorSpy.mockRestore();
  });
});
