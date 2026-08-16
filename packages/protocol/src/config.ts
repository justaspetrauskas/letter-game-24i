import type { GameConfig } from "@letter-game/engine";

export interface NumericBound {
  min: number;
  max: number;
  integer?: boolean;
}

export const configBounds = {
  minMatch: { min: 2, max: 5, integer: true },
  lives: { min: 1, max: 99, integer: true },
  maxLevel: { min: 1, max: 20, integer: true },
  spawnsPerLevel: { min: 1, max: 200, integer: true },
  spawnDelaySpeedupPerLevel: { min: 0.5, max: 1 },
  fallSpeedPerLevel: { min: 0, max: 2 },
  comboWindowMs: { min: 500, max: 15000, integer: true },
  landedLingerMs: { min: 0, max: 5000, integer: true },
  maxRetainedEvents: { min: 8, max: 512, integer: true },
} satisfies Record<string, NumericBound>;

export const rangeBounds = {
  spawnDelayMs: { min: 150, max: 10000, integer: true },
  fallSpeed: { min: 0.005, max: 1 },
  letterSize: { min: 0.04, max: 0.4 },
} satisfies Record<string, NumericBound>;

export const MAX_LETTER_POOL_LENGTH = 26;

function clampNumber(value: unknown, bound: NumericBound): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  const clamped = Math.min(Math.max(value, bound.min), bound.max);
  return bound.integer ? Math.round(clamped) : clamped;
}

function clampRange(
  value: unknown,
  bound: NumericBound
): [number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 2) {
    return undefined;
  }
  const low = clampNumber(value[0], bound);
  const high = clampNumber(value[1], bound);
  if (low === undefined || high === undefined) {
    return undefined;
  }
  return low <= high ? [low, high] : [high, low];
}

export function sanitiseLetterPool(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const seen: string[] = [];
  for (const char of value.toLowerCase()) {
    if (char >= "a" && char <= "z" && seen.indexOf(char) === -1) {
      seen.push(char);
    }
  }

  if (seen.length === 0) {
    return undefined;
  }
  return seen.slice(0, MAX_LETTER_POOL_LENGTH).join("");
}

export function sanitiseGameConfig(input: unknown): Partial<GameConfig> {
  if (input === null || typeof input !== "object") {
    return {};
  }

  const raw = input as Record<string, unknown>;
  const safe: Partial<GameConfig> = {};

  const letterPool = sanitiseLetterPool(raw.letterPool);
  if (letterPool !== undefined) {
    safe.letterPool = letterPool;
  }

  for (const key of Object.keys(configBounds) as (keyof typeof configBounds)[]) {
    const clamped = clampNumber(raw[key], configBounds[key]);
    if (clamped !== undefined) {
      safe[key] = clamped;
    }
  }

  for (const key of Object.keys(rangeBounds) as (keyof typeof rangeBounds)[]) {
    const clamped = clampRange(raw[key], rangeBounds[key]);
    if (clamped !== undefined) {
      safe[key] = clamped;
    }
  }

  return safe;
}
