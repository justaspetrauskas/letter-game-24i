import type { GameEvent } from "@letter-game/engine";

export const RIVAL_WINDOW_MS = 5000;

export const RIVAL_MIN_INTERVAL_MS = 7000;

export const RIVAL_HISTORY_SIZE = 6;

export const MAX_RIVAL_LINE_LENGTH = 120;

export const MAX_BUFFERED_EVENTS = 300;

export const BIG_CLEAR_THRESHOLD = 3;

export const MISS_BURST_THRESHOLD = 3;

export const MISFIRE_BURST_THRESHOLD = 3;

export interface RivalSnapshot {
  clears: number;
  biggestClear: number;
  bestCombo: number;
  points: number;
  misses: number;
  missedChars: string[];
  missedWithTwin: number;
  misfires: number;
  misfireChars: string[];
  levelUp: number | null;
  livesLeft: number | null;
  gameOver: boolean;
  finalScore: number | null;
}

export interface RivalRequest {
  snapshot: RivalSnapshot;
  recentLines: string[];
}

export interface RivalResponse {
  line: string;
}

export function emptySnapshot(): RivalSnapshot {
  return {
    clears: 0,
    biggestClear: 0,
    bestCombo: 0,
    points: 0,
    misses: 0,
    missedChars: [],
    missedWithTwin: 0,
    misfires: 0,
    misfireChars: [],
    levelUp: null,
    livesLeft: null,
    gameOver: false,
    finalScore: null,
  };
}

export function summariseEvents(events: GameEvent[]): RivalSnapshot {
  const snapshot = emptySnapshot();

  for (const event of events) {
    switch (event.type) {
      case "clear":
        snapshot.clears += 1;
        snapshot.points += event.points;
        snapshot.biggestClear = Math.max(snapshot.biggestClear, event.count);
        snapshot.bestCombo = Math.max(snapshot.bestCombo, event.combo);
        break;

      case "miss":
        snapshot.misses += 1;
        snapshot.livesLeft = event.livesLeft;
        if (snapshot.missedChars.indexOf(event.char) === -1) {
          snapshot.missedChars.push(event.char);
        }
        if (event.onScreenMatches > 0) {
          snapshot.missedWithTwin += 1;
        }
        break;

      case "misfire":
        snapshot.misfires += 1;
        if (snapshot.misfireChars.indexOf(event.char) === -1) {
          snapshot.misfireChars.push(event.char);
        }
        break;

      case "levelUp":
        snapshot.levelUp = event.level;
        break;

      case "gameOver":
        snapshot.gameOver = true;
        snapshot.finalScore = event.score;
        break;

      default:
        break;
    }
  }

  return snapshot;
}

export function shouldCommentate(snapshot: RivalSnapshot): boolean {
  if (snapshot.gameOver) {
    return true;
  }
  if (snapshot.levelUp !== null) {
    return true;
  }
  if (snapshot.biggestClear >= BIG_CLEAR_THRESHOLD) {
    return true;
  }
  if (snapshot.missedWithTwin > 0) {
    return true;
  }
  if (snapshot.misses >= MISS_BURST_THRESHOLD) {
    return true;
  }
  if (snapshot.misfires >= MISFIRE_BURST_THRESHOLD) {
    return true;
  }
  return false;
}

const MAX_COUNT = 99_999;

const MAX_TRACKED_CHARS = 8;

function clampCount(value: unknown, max = MAX_COUNT): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(Math.round(value), 0), max);
}

function clampOptionalCount(value: unknown, max: number): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return Math.min(Math.max(Math.round(value), 0), max);
}

function sanitiseChars(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const chars: string[] = [];
  for (const entry of value) {
    if (
      typeof entry === "string" &&
      entry.length === 1 &&
      entry >= "a" &&
      entry <= "z" &&
      chars.indexOf(entry) === -1
    ) {
      chars.push(entry);
    }
    if (chars.length >= MAX_TRACKED_CHARS) {
      break;
    }
  }
  return chars;
}

export function sanitiseRivalSnapshot(raw: unknown): RivalSnapshot {
  if (raw === null || typeof raw !== "object") {
    return emptySnapshot();
  }

  const source = raw as Record<string, unknown>;

  return {
    clears: clampCount(source.clears),
    biggestClear: clampCount(source.biggestClear, 999),
    bestCombo: clampCount(source.bestCombo, 999),
    points: clampCount(source.points),
    misses: clampCount(source.misses),
    missedChars: sanitiseChars(source.missedChars),
    missedWithTwin: clampCount(source.missedWithTwin),
    misfires: clampCount(source.misfires),
    misfireChars: sanitiseChars(source.misfireChars),
    levelUp: clampOptionalCount(source.levelUp, 99),
    livesLeft: clampOptionalCount(source.livesLeft, 999),
    gameOver: source.gameOver === true,
    finalScore: clampOptionalCount(source.finalScore, 9_999_999),
  };
}

export function sanitiseRecentLines(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const lines: string[] = [];
  for (const entry of raw) {
    const line = sanitiseRivalLine(entry);
    if (line.length > 0) {
      lines.push(line);
    }
    if (lines.length >= RIVAL_HISTORY_SIZE) {
      break;
    }
  }
  return lines;
}

export function sanitiseRivalLine(raw: unknown): string {
  if (typeof raw !== "string") {
    return "";
  }

  return raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim()
    .slice(0, MAX_RIVAL_LINE_LENGTH);
}
