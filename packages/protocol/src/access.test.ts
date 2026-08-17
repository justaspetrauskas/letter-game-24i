import { describe, expect, it } from "vitest";
import {
  MAX_ACCESS_KEY_LENGTH,
  accessKeysMatch,
  sanitiseAccessKey,
} from "./access";

describe("sanitiseAccessKey", () => {
  it("trims a hand-typed key", () => {
    expect(sanitiseAccessKey("  falling-letters  ")).toEqual("falling-letters");
  });

  it("returns empty for anything that is not a string", () => {
    expect(sanitiseAccessKey(undefined)).toEqual("");
    expect(sanitiseAccessKey(42)).toEqual("");
    expect(sanitiseAccessKey(["key"])).toEqual("");
  });

  it("caps the length", () => {
    expect(sanitiseAccessKey("k".repeat(500))).toHaveLength(
      MAX_ACCESS_KEY_LENGTH
    );
  });
});

describe("accessKeysMatch", () => {
  it("ignores case and surrounding space", () => {
    expect(accessKeysMatch(" Falling-Letters ", "falling-letters")).toEqual(
      true
    );
  });

  it("rejects a different key", () => {
    expect(accessKeysMatch("nope", "falling-letters")).toEqual(false);
  });

  it("never matches on an empty key", () => {
    expect(accessKeysMatch("", "")).toEqual(false);
    expect(accessKeysMatch("   ", "")).toEqual(false);
    expect(accessKeysMatch(null, undefined)).toEqual(false);
  });
});
