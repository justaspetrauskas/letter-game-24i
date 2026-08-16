export const PROGRESS_REPORT_MS = 500;

export const PROGRESS_BROADCAST_MS = 500;

const MAX_SCORE = 9_999_999;

const MAX_COUNT = 99_999;

export interface PlayerProgress {
  score: number;
  lives: number;
  level: number;
  cleared: number;
  missed: number;
  finished: boolean;
}

function clamp(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(Math.round(value), 0), max);
}

export function emptyProgress(): PlayerProgress {
  return {
    score: 0,
    lives: 0,
    level: 1,
    cleared: 0,
    missed: 0,
    finished: false,
  };
}

export function sanitiseProgress(raw: unknown): PlayerProgress {
  if (raw === null || typeof raw !== "object") {
    return emptyProgress();
  }

  const source = raw as Record<string, unknown>;

  return {
    score: clamp(source.score, MAX_SCORE),
    lives: clamp(source.lives, MAX_COUNT),
    level: Math.max(1, clamp(source.level, 999)),
    cleared: clamp(source.cleared, MAX_COUNT),
    missed: clamp(source.missed, MAX_COUNT),
    finished: source.finished === true,
  };
}

export const MAX_ATTACK_LETTERS = 5;

export const ATTACKS_PER_WINDOW = 6;

export const ATTACK_REFILL_MS = 1000;

export interface AttackPayload {
  count: number;
}

export interface AttackedPayload {
  from: string;
  count: number;
}

export function sanitiseAttackCount(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return 0;
  }
  return Math.min(Math.max(Math.round(raw), 0), MAX_ATTACK_LETTERS);
}
