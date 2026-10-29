import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useToolRunner } from "./ConfigView.shared";

describe("useToolRunner without a bridge", () => {
  it("fails visibly (an error message) instead of doing nothing", async () => {
    const { result } = renderHook(() => useToolRunner(undefined, "en"));
    expect(result.current.canCall).toBe(false);
    let out: unknown = "unset";
    await act(async () => {
      out = await result.current.call("t", {});
    });
    expect(out).toBeUndefined();
    expect(result.current.error).toBe("The tool call failed: no host bridge");
    expect(result.current.busy).toBe(false);
  });
});
