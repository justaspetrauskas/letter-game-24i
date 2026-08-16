import { GameConfig } from "./types";

export const STEP_MS = 1000 / 60;

export const MAX_CATCHUP_STEPS = 6;

export const MAX_PENDING_JUNK = 20;

export const JUNK_SEED_OFFSET = 0x9e3779b9;

export const defaultConfig: GameConfig = {
  letterPool: "asdfghjkl",
  minMatch: 2,
  lives: 20,
  maxLevel: 8,
  spawnsPerLevel: 15,
  spawnDelayMs: [1900, 2400],
  spawnDelaySpeedupPerLevel: 0.86,
  fallSpeed: [0.035, 0.09],
  fallSpeedPerLevel: 0.14,
  letterSize: [0.1, 0.19],
  comboWindowMs: 2600,
  landedLingerMs: 700,
  maxRetainedEvents: 64,
  attackThreshold: 4,
  maxAttackLetters: 5,
  junkSpeedMultiplier: 1.3,
  maxLettersOnScreen: 40,
};

export const roundPresets: Record<string, Partial<GameConfig>> = {
  homeRow: { letterPool: "asdfghjkl" },
  vowels: { letterPool: "aeiou", minMatch: 2 },
  fullAlphabet: { letterPool: "abcdefghijklmnopqrstuvwxyz", minMatch: 2 },
  triples: { letterPool: "asdfg", minMatch: 3, lives: 25 },
  sprint: {
    letterPool: "asdfghjkl",
    lives: 10,
    spawnDelayMs: [900, 1400],
    fallSpeed: [0.07, 0.15],
  },
};

export function resolveConfig(overrides?: Partial<GameConfig>): GameConfig {
  return { ...defaultConfig, ...overrides };
}
