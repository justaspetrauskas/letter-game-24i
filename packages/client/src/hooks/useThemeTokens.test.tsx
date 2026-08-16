import { afterEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useThemeTokens, withAlpha } from "@/hooks/useThemeTokens";

const SET_VARS: Array<[string, string]> = [
  ["--lg-crate", "192 127 51"],
  ["--lg-fire-2", "255 154 46"],
  ["--lg-sky-top", "23 27 61"],
];

function setTokens(): void {
  SET_VARS.forEach(([name, value]) => {
    document.documentElement.style.setProperty(name, value);
  });
}

afterEach(() => {
  SET_VARS.forEach(([name]) => {
    document.documentElement.style.removeProperty(name);
  });
});

describe("useThemeTokens", () => {
  it("wraps declared channels as canvas-ready rgb strings", () => {
    setTokens();

    const { result } = renderHook(() => useThemeTokens());

    expect(result.current.crate).toEqual("rgb(192 127 51)");
    expect(result.current.fire2).toEqual("rgb(255 154 46)");
    expect(result.current.skyTop).toEqual("rgb(23 27 61)");
  });

  it("falls back to a visible grey when a token is undeclared", () => {
    const { result } = renderHook(() => useThemeTokens());

    expect(result.current.crate).toEqual("rgb(128 128 128)");
  });

  it("keeps the same object when a re-read finds no change", () => {
    setTokens();

    const { result, rerender } = renderHook(() => useThemeTokens());
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });

  it("converts a token to an alpha colour", () => {
    expect(withAlpha("rgb(192 127 51)", 0.4)).toEqual("rgba(192 127 51 / 0.4)");
  });
});
