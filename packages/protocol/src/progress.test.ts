import { describe, expect, it } from "vitest";
import {
  MAX_ATTACK_LETTERS,
  emptyProgress,
  sanitiseAttackCount,
  sanitiseProgress,
} from "./progress";

describe("sanitiseProgress", () => {
  it("keeps a well-formed report", () => {
    const progress = sanitiseProgress({
      score: 420,
      lives: 14,
      level: 3,
      cleared: 22,
      missed: 6,
      finished: false,
    });

    expect(progress).toEqual({
      score: 420,
      lives: 14,
      level: 3,
      cleared: 22,
      missed: 6,
      finished: false,
    });
  });

  it("clamps a forged score", () => {
    expect(sanitiseProgress({ score: 1e12 }).score).toEqual(9_999_999);
    expect(sanitiseProgress({ score: -50 }).score).toEqual(0);
  });

  it("rounds fractional counts", () => {
    expect(sanitiseProgress({ cleared: 4.6 }).cleared).toEqual(5);
  });

  it("keeps level at one or above", () => {
    expect(sanitiseProgress({ level: 0 }).level).toEqual(1);
    expect(sanitiseProgress({ level: -3 }).level).toEqual(1);
  });

  it("ignores non-numeric values", () => {
    expect(sanitiseProgress({ score: "9999", lives: null }).score).toEqual(0);
    expect(sanitiseProgress({ score: Number.NaN }).score).toEqual(0);
  });

  it("only accepts a literal true for finished", () => {
    expect(sanitiseProgress({ finished: "yes" }).finished).toBe(false);
    expect(sanitiseProgress({ finished: true }).finished).toBe(true);
  });

  it("returns empty progress for junk", () => {
    expect(sanitiseProgress(null)).toEqual(emptyProgress());
    expect(sanitiseProgress("nope")).toEqual(emptyProgress());
  });
});

describe("sanitiseAttackCount", () => {
  it("keeps a sensible count", () => {
    expect(sanitiseAttackCount(3)).toEqual(3);
  });

  it("clamps to the maximum", () => {
    expect(sanitiseAttackCount(9999)).toEqual(MAX_ATTACK_LETTERS);
  });

  it("floors a negative count at zero", () => {
    expect(sanitiseAttackCount(-4)).toEqual(0);
  });

  it("rounds a fractional count", () => {
    expect(sanitiseAttackCount(2.6)).toEqual(3);
  });

  it("rejects anything non-numeric", () => {
    expect(sanitiseAttackCount("5")).toEqual(0);
    expect(sanitiseAttackCount(null)).toEqual(0);
    expect(sanitiseAttackCount(Number.NaN)).toEqual(0);
    expect(sanitiseAttackCount(Number.POSITIVE_INFINITY)).toEqual(0);
  });
});
