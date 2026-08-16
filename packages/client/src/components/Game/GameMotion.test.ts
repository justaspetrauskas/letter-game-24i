import { describe, expect, it } from "vitest";
import {
  cloudDrift,
  fuseFlicker,
  junkBlink,
  landedFade,
  popProgress,
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
