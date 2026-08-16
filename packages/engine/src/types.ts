import { Rng } from "./rng";

export type LetterStatus = "falling" | "landed";

export type LetterKind = "normal" | "junk";

export type GameStatus = "playing" | "paused" | "finished";

export interface LetterState {
  id: string;
  char: string;
  centerX: number;
  bottomY: number;
  size: number;
  speed: number;
  hue: number;
  status: LetterStatus;
  kind: LetterKind;
  spawnedAtMs: number;
  landedAtMs: number | null;
}

export interface GameConfig {
  letterPool: string;
  minMatch: number;
  lives: number;
  maxLevel: number;
  spawnsPerLevel: number;
  spawnDelayMs: [number, number];
  spawnDelaySpeedupPerLevel: number;
  fallSpeed: [number, number];
  fallSpeedPerLevel: number;
  letterSize: [number, number];
  comboWindowMs: number;
  landedLingerMs: number;
  maxRetainedEvents: number;
  attackThreshold: number;
  maxAttackLetters: number;
  junkSpeedMultiplier: number;
  maxLettersOnScreen: number;
}

export type GameEvent =
  | { type: "spawn"; atMs: number; id: string; char: string }
  | {
      type: "clear";
      atMs: number;
      char: string;
      count: number;
      points: number;
      combo: number;
      attack: number;
    }
  | {
      type: "miss";
      atMs: number;
      char: string;
      id: string;
      livesLeft: number;
      onScreenMatches: number;
    }
  | { type: "misfire"; atMs: number; char: string; onScreen: number }
  | { type: "junk"; atMs: number; count: number }
  | { type: "levelUp"; atMs: number; level: number }
  | { type: "gameOver"; atMs: number; score: number; spawned: number };

export interface GameState {
  status: GameStatus;
  tick: number;
  timeMs: number;
  rng: Rng;
  junkRng: Rng;
  config: GameConfig;
  letters: LetterState[];
  events: GameEvent[];
  score: number;
  combo: number;
  bestCombo: number;
  comboExpiresAtMs: number;
  lives: number;
  level: number;
  spawned: number;
  cleared: number;
  missed: number;
  misfires: number;
  nextSpawnAtMs: number;
  nextLetterId: number;
  nextJunkId: number;
  pendingJunk: number;
  junkReceived: number;
  junkSent: number;
  hitsByChar: Record<string, number>;
  missesByChar: Record<string, number>;
}
