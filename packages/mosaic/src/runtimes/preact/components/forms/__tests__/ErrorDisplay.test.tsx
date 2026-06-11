import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorDisplay } from "../ErrorDisplay";

describe("preact/forms ErrorDisplay parity", () => {
  it("exports ErrorDisplay", () => {
    expect(typeof ErrorDisplay).toBe("function");
  });

  it("renders error message via shared logic", () => {
    render(<ErrorDisplay error={{ type: "required", message: "X" }} />);
    expect(screen.getByRole("alert").textContent).toBe("X");
  });
});
