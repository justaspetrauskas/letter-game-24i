import { describe, expect, it } from "vitest";
import {
  burstProgress,
  cloudDrift,
  easeOut,
  fuseFlicker,
  junkBlink,
  landedFade,
  popProgress,
  pseudoRandom,
  shakeOffset,
  shardOffset,
  tileRotation,
  tileSway,
  POP_IN_MS,
} from "@/components/Game/GameMotion";

describe("popProgress", () => {
  it("runs from nothing to full across the pop window", () => {
    expect(popProgress(1000, 1000)).toEqual(0);
    expect(popProgress(1000 + POP_IN_MS / 2, 1000)).toBeCloseTo(0.5);
    expect(popProgress(1000 + POP_IN_MS, 1000)).toEqual(1);
  });

  it("stays clamped once the pop is over", () => {
    expect(popProgress(9000, 1000)).toEqual(1);
  });
});

describe("landedFade", () => {
  it("fades from full to nothing across the linger", () => {
    expect(landedFade(500, 500, 700)).toEqual(1);
    expect(landedFade(850, 500, 700)).toBeCloseTo(0.5);
    expect(landedFade(1200, 500, 700)).toEqual(0);
  });

  it("holds a falling letter fully opaque", () => {
    expect(landedFade(500, null, 700)).toEqual(1);
  });
});

describe("tileRotation", () => {
  it("stays within the tilt spread for every hue the engine can roll", () => {
    for (let hue = 0; hue <= 359; hue += 1) {
      expect(Math.abs(tileRotation(hue))).toBeLessThanOrEqual(3.5);
    }
  });

  it("gives neighbouring letters different tilts", () => {
    expect(tileRotation(10)).not.toEqual(tileRotation(11));
  });
});

describe("tileSway", () => {
  it("stays inside the sway amplitude", () => {
    for (let timeMs = 0; timeMs < 4000; timeMs += 17) {
      expect(Math.abs(tileSway(120, timeMs))).toBeLessThanOrEqual(0.035);
    }
  });

  it("is a pure function of engine time, so pausing freezes it", () => {
    expect(tileSway(200, 1234)).toEqual(tileSway(200, 1234));
  });

  it("gives two tiles different phases", () => {
    expect(tileSway(0, 300)).not.toEqual(tileSway(180, 300));
  });
});

describe("fuseFlicker", () => {
  it("never dims the spark to nothing", () => {
    for (let timeMs = 0; timeMs < 2000; timeMs += 13) {
      const value = fuseFlicker(45, timeMs);
      expect(value).toBeGreaterThanOrEqual(0.62);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("junkBlink", () => {
  it("alternates between lit and dim", () => {
    expect(junkBlink(155)).toEqual(1);
    expect(junkBlink(465)).toEqual(0.25);
  });
});

describe("cloudDrift", () => {
  it("keeps a drifting cloud inside the wrap band", () => {
    for (let timeMs = 0; timeMs < 600000; timeMs += 997) {
      const x = cloudDrift(0.42, 0.03, timeMs);
      expect(x).toBeGreaterThanOrEqual(-0.35);
      expect(x).toBeLessThan(1.15);
    }
  });

  it("wraps back around rather than drifting away forever", () => {
    const start = cloudDrift(0.2, 0.05, 0);
    const wrapped = cloudDrift(0.2, 0.05, (1.5 / 0.05) * 1000);
    expect(wrapped).toBeCloseTo(start, 6);
  });

  it("moves left to right over time", () => {
    expect(cloudDrift(0.2, 0.05, 1000)).toBeGreaterThan(
      cloudDrift(0.2, 0.05, 0)
    );
  });
});

describe("burstProgress", () => {
  it("runs from zero to one across the burst duration", () => {
    expect(burstProgress(1000, 1000, 700)).toEqual(0);
    expect(burstProgress(1350, 1000, 700)).toBeCloseTo(0.5);
    expect(burstProgress(1700, 1000, 700)).toEqual(1);
  });

  it("goes negative for a burst from a game that has already restarted", () => {
    expect(burstProgress(120, 4000, 700)).toBeLessThan(0);
  });
});

describe("easeOut", () => {
  it("starts fast and settles at one", () => {
    expect(easeOut(0)).toEqual(0);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
    expect(easeOut(1)).toEqual(1);
  });

  it("clamps outside the unit range", () => {
    expect(easeOut(-2)).toEqual(0);
    expect(easeOut(9)).toEqual(1);
  });
});

describe("pseudoRandom", () => {
  it("stays inside the unit range", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const value = pseudoRandom(seed);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("is stable for a given seed, so a shard keeps its trajectory", () => {
    expect(pseudoRandom(42)).toEqual(pseudoRandom(42));
    expect(pseudoRandom(42)).not.toEqual(pseudoRandom(43));
  });
});

describe("shardOffset", () => {
  it("starts at the burst centre", () => {
    const at = shardOffset(1.2, 1.5, 0);
    expect(at.dx).toEqual(0);
    expect(at.dy).toEqual(0);
  });

  it("arcs downward under gravity even when thrown upward", () => {
    const up = -Math.PI / 2;
    const rising = shardOffset(up, 1.5, 0.2);
    const falling = shardOffset(up, 1.5, 1);
    expect(rising.dy).toBeLessThan(0);
    expect(falling.dy).toBeGreaterThan(rising.dy);
  });
});

describe("shakeOffset", () => {
  it("decays towards nothing", () => {
    const early = Math.abs(shakeOffset(10, 10).x);
    const late = Math.abs(shakeOffset(400, 10).x);
    expect(late).toBeLessThan(early);
    expect(late).toBeLessThan(0.5);
  });

  it("never exceeds the requested magnitude", () => {
    for (let elapsed = 0; elapsed < 500; elapsed += 3) {
      expect(Math.abs(shakeOffset(elapsed, 8).x)).toBeLessThanOrEqual(8);
      expect(Math.abs(shakeOffset(elapsed, 8).y)).toBeLessThanOrEqual(8);
    }
  });

  it("stays still for a burst that has not happened yet", () => {
    expect(shakeOffset(-50, 10)).toEqual({ x: 0, y: 0 });
  });
});
