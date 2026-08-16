import { describe, expect, it, vi } from "vitest";
import { RoundGenerationError, createRoundService, toThemedRound } from "@/ai/rounds/rounds";

const validPayload = {
  name: "Deep Ocean Drift",
  description: "Letters sink slowly through the dark.",
  letterPool: "ocean",
  minMatch: 2,
  lives: 30,
  spawnDelayMs: [1800, 2600],
  fallSpeed: [0.03, 0.06],
};

describe("availability", () => {
  it("is unavailable without a key or completion", () => {
    const service = createRoundService();

    expect(service.available).toBe(false);
  });

  it("refuses to generate when unavailable", async () => {
    const service = createRoundService();

    await expect(service.generate("ocean")).rejects.toMatchObject({
      code: "ai_unavailable",
    });
  });

  it("is available when a completion is supplied", () => {
    const service = createRoundService({ complete: async () => validPayload });

    expect(service.available).toBe(true);
  });
});

describe("generation", () => {
  it("builds a round from a valid payload", async () => {
    const service = createRoundService({ complete: async () => validPayload });
    const round = await service.generate("deep ocean");

    expect(round.name).toEqual("Deep Ocean Drift");
    expect(round.theme).toEqual("deep ocean");
    expect(round.id).toEqual("round-deep-ocean");
    expect(round.config.letterPool).toEqual("ocean");
    expect(round.config.lives).toEqual(30);
    expect(round.config.spawnDelayMs).toEqual([1800, 2600]);
  });

  it("rejects a blank theme", async () => {
    const service = createRoundService({ complete: async () => validPayload });

    await expect(service.generate("   ")).rejects.toMatchObject({
      code: "invalid_theme",
    });
  });

  it("clamps a payload that ignores the stated ranges", async () => {
    const service = createRoundService({
      complete: async () => ({
        ...validPayload,
        minMatch: 99,
        lives: 0,
        spawnDelayMs: [9000, 50],
        fallSpeed: [12, 12],
      }),
    });

    const round = await service.generate("chaos");

    expect(round.config.minMatch).toEqual(5);
    expect(round.config.lives).toEqual(1);
    expect(round.config.spawnDelayMs).toEqual([150, 9000]);
    expect(round.config.fallSpeed).toEqual([1, 1]);
  });

  it("strips non-letters from the pool", async () => {
    const service = createRoundService({
      complete: async () => ({ ...validPayload, letterPool: "A-B-C 123 aab" }),
    });

    const round = await service.generate("punctuation");

    expect(round.config.letterPool).toEqual("abc");
  });

  it("fails when the pool is unusable", async () => {
    const service = createRoundService({
      complete: async () => ({ ...validPayload, letterPool: "!!!!" }),
    });

    await expect(service.generate("nonsense")).rejects.toMatchObject({
      code: "generation_failed",
    });
  });

  it("fails when the payload is not an object", async () => {
    const service = createRoundService({ complete: async () => "nope" });

    await expect(service.generate("bad")).rejects.toMatchObject({
      code: "generation_failed",
    });
  });

  it("falls back to the theme when the name is missing", async () => {
    const service = createRoundService({
      complete: async () => ({ ...validPayload, name: "   " }),
    });

    const round = await service.generate("volcano");

    expect(round.name).toEqual("volcano");
  });

  it("caps an overlong name", async () => {
    const service = createRoundService({
      complete: async () => ({ ...validPayload, name: "x".repeat(200) }),
    });

    const round = await service.generate("long");

    expect(round.name.length).toEqual(40);
  });

  it("propagates a refusal", async () => {
    const service = createRoundService({
      complete: async () => {
        throw new RoundGenerationError("refused", "declined");
      },
    });

    await expect(service.generate("anything")).rejects.toMatchObject({
      code: "refused",
    });
  });
});

describe("caching", () => {
  it("reuses a generated round for the same theme", async () => {
    const complete = vi.fn(async () => validPayload);
    const service = createRoundService({ complete });

    await service.generate("ocean");
    await service.generate("ocean");

    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("ignores case and surrounding whitespace", async () => {
    const complete = vi.fn(async () => validPayload);
    const service = createRoundService({ complete });

    await service.generate("Ocean");
    await service.generate("  ocean  ");

    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("regenerates once the entry expires", async () => {
    let clock = 0;
    const complete = vi.fn(async () => validPayload);
    const service = createRoundService({
      complete,
      cacheTtlMs: 1000,
      now: () => clock,
    });

    await service.generate("ocean");
    clock = 1500;
    await service.generate("ocean");

    expect(complete).toHaveBeenCalledTimes(2);
  });

  it("evicts the oldest entry at the cache limit", async () => {
    const service = createRoundService({
      complete: async () => validPayload,
      cacheLimit: 2,
    });

    await service.generate("one");
    await service.generate("two");
    await service.generate("three");

    expect(service.cacheSize()).toBeLessThanOrEqual(2);
  });

  it("does not cache a failed generation", async () => {
    const complete = vi.fn(async () => ({ ...validPayload, letterPool: "" }));
    const service = createRoundService({ complete });

    await expect(service.generate("bad")).rejects.toThrow();
    await expect(service.generate("bad")).rejects.toThrow();

    expect(complete).toHaveBeenCalledTimes(2);
  });
});

describe("toThemedRound", () => {
  it("drops keys the engine does not define", () => {
    const round = toThemedRound("theme", {
      ...validPayload,
      sudoMode: true,
      letterPool: "abcd",
    });

    expect(round.config).not.toHaveProperty("sudoMode");
  });
});
