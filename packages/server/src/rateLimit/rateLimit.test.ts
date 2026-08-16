import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/rateLimit/rateLimit";

describe("rate limiter", () => {
  it("allows up to the capacity", () => {
    const limiter = createRateLimiter({ capacity: 3, refillMs: 1000, now: () => 0 });

    expect(limiter.take("a")).toBe(true);
    expect(limiter.take("a")).toBe(true);
    expect(limiter.take("a")).toBe(true);
    expect(limiter.take("a")).toBe(false);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ capacity: 1, refillMs: 1000, now: () => 0 });

    expect(limiter.take("a")).toBe(true);
    expect(limiter.take("b")).toBe(true);
    expect(limiter.take("a")).toBe(false);
  });

  it("refills over time", () => {
    let clock = 0;
    const limiter = createRateLimiter({
      capacity: 2,
      refillMs: 1000,
      now: () => clock,
    });

    limiter.take("a");
    limiter.take("a");
    expect(limiter.take("a")).toBe(false);

    clock = 1000;
    expect(limiter.take("a")).toBe(true);
  });

  it("never refills past the capacity", () => {
    let clock = 0;
    const limiter = createRateLimiter({
      capacity: 2,
      refillMs: 1000,
      now: () => clock,
    });

    limiter.take("a");
    clock = 100_000;

    expect(limiter.take("a")).toBe(true);
    expect(limiter.take("a")).toBe(true);
    expect(limiter.take("a")).toBe(false);
  });

  it("reports how long until the next token", () => {
    let clock = 0;
    const limiter = createRateLimiter({
      capacity: 1,
      refillMs: 1000,
      now: () => clock,
    });

    limiter.take("a");
    clock = 400;

    expect(limiter.retryAfterMs("a")).toEqual(600);
  });

  it("reports zero when tokens remain", () => {
    const limiter = createRateLimiter({ capacity: 2, refillMs: 1000, now: () => 0 });

    limiter.take("a");

    expect(limiter.retryAfterMs("a")).toEqual(0);
  });
});
