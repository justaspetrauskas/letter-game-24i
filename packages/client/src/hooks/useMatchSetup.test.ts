import { describe, expect, it } from "vitest";
import { defaultConfig } from "@letter-game/engine";
import {
  easeConfigForViewport,
  viewportSpeedScale,
  MIN_SPEED_SCALE,
  REFERENCE_HEIGHT,
} from "@/hooks/useMatchSetup";

describe("viewportSpeedScale", () => {
  it("leaves a full-height window alone", () => {
    expect(viewportSpeedScale(REFERENCE_HEIGHT)).toEqual(1);
    expect(viewportSpeedScale(1400)).toEqual(1);
  });

  it("eases off as the window gets shorter", () => {
    expect(viewportSpeedScale(650)).toBeLessThan(1);
    expect(viewportSpeedScale(500)).toBeLessThan(viewportSpeedScale(650));
  });

  it("never eases below the floor, however small the window", () => {
    expect(viewportSpeedScale(120)).toEqual(MIN_SPEED_SCALE);
    expect(viewportSpeedScale(1)).toEqual(MIN_SPEED_SCALE);
  });

  it("survives a nonsense height rather than freezing the game", () => {
    expect(viewportSpeedScale(0)).toEqual(1);
    expect(viewportSpeedScale(Number.NaN)).toEqual(1);
  });
});

describe("easeConfigForViewport", () => {
  it("returns the config untouched on a tall window", () => {
    const config = { letterPool: "abc" };
    expect(easeConfigForViewport(config, 1000)).toBe(config);
  });

  it("slows the fall on a short window without touching anything else", () => {
    const eased = easeConfigForViewport({ letterPool: "abc" }, 480);

    expect(eased.letterPool).toEqual("abc");
    expect(eased.fallSpeed?.[0]).toBeLessThan(defaultConfig.fallSpeed[0]);
    expect(eased.fallSpeed?.[1]).toBeLessThan(defaultConfig.fallSpeed[1]);
  });

  it("eases a round's own speed rather than the default", () => {
    const eased = easeConfigForViewport({ fallSpeed: [0.2, 0.4] }, 410);

    expect(eased.fallSpeed?.[0]).toBeCloseTo(0.2 * MIN_SPEED_SCALE);
    expect(eased.fallSpeed?.[1]).toBeCloseTo(0.4 * MIN_SPEED_SCALE);
  });

  it("keeps the fast end faster than the slow end", () => {
    const eased = easeConfigForViewport({}, 500);
    expect(eased.fallSpeed?.[1]).toBeGreaterThan(eased.fallSpeed?.[0] as number);
  });
});
