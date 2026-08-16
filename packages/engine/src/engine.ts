import {
  cloneRng,
  createRng,
  nextInt,
  nextRange,
  pickChar,
  randomSeed,
} from "./rng";
import {
  JUNK_SEED_OFFSET,
  MAX_PENDING_JUNK,
  resolveConfig,
  STEP_MS,
} from "./config";
import { GameConfig, GameEvent, GameState, LetterKind, LetterState } from "./types";

const STEP_SECONDS = STEP_MS / 1000;

const MIN_SPAWN_DELAY_MS = 180;

const HORIZONTAL_MARGIN = 0.06;

function cloneState(state: GameState): GameState {
  return {
    ...state,
    rng: cloneRng(state.rng),
    junkRng: cloneRng(state.junkRng),
    letters: state.letters.map((letter) => ({ ...letter })),
    events: state.events.slice(),
    hitsByChar: { ...state.hitsByChar },
    missesByChar: { ...state.missesByChar },
  };
}

function emit(state: GameState, event: GameEvent): void {
  state.events.push(event);
  const overflow = state.events.length - state.config.maxRetainedEvents;
  if (overflow > 0) {
    state.events.splice(0, overflow);
  }
}

function levelFor(state: GameState): number {
  return Math.min(
    state.config.maxLevel,
    1 + Math.floor(state.spawned / state.config.spawnsPerLevel)
  );
}

function rollNextSpawnTime(state: GameState): number {
  const [min, max] = state.config.spawnDelayMs;
  const scale = Math.pow(
    state.config.spawnDelaySpeedupPerLevel,
    state.level - 1
  );
  const delay = Math.max(
    MIN_SPAWN_DELAY_MS,
    nextRange(state.rng, min, max) * scale
  );
  return state.timeMs + delay;
}

function buildLetter(state: GameState, kind: LetterKind): LetterState {
  const { config } = state;
  const rng = kind === "junk" ? state.junkRng : state.rng;
  const speedBoost = kind === "junk" ? config.junkSpeedMultiplier : 1;

  return {
    id:
      kind === "junk" ? `J${state.nextJunkId}` : `L${state.nextLetterId}`,
    char: pickChar(rng, config.letterPool),
    centerX: nextRange(rng, HORIZONTAL_MARGIN, 1 - HORIZONTAL_MARGIN),
    bottomY: 0,
    size: nextRange(rng, config.letterSize[0], config.letterSize[1]),
    speed:
      nextRange(rng, config.fallSpeed[0], config.fallSpeed[1]) *
      (1 + (state.level - 1) * config.fallSpeedPerLevel) *
      speedBoost,
    hue: nextInt(rng, 0, 359),
    status: "falling",
    kind,
    spawnedAtMs: state.timeMs,
    landedAtMs: null,
  };
}

function spawnLetter(state: GameState): void {
  const letter = buildLetter(state, "normal");

  state.nextLetterId += 1;
  state.spawned += 1;
  state.letters.push(letter);
  emit(state, {
    type: "spawn",
    atMs: state.timeMs,
    id: letter.id,
    char: letter.char,
  });

  const updatedLevel = levelFor(state);
  if (updatedLevel !== state.level) {
    state.level = updatedLevel;
    emit(state, { type: "levelUp", atMs: state.timeMs, level: updatedLevel });
  }
}

function flushPendingJunk(state: GameState): void {
  if (state.pendingJunk <= 0) {
    return;
  }

  let dropped = 0;
  while (
    state.pendingJunk > 0 &&
    state.letters.length < state.config.maxLettersOnScreen
  ) {
    state.letters.push(buildLetter(state, "junk"));
    state.nextJunkId += 1;
    state.pendingJunk -= 1;
    dropped += 1;
  }

  if (dropped > 0) {
    state.junkReceived += dropped;
    emit(state, { type: "junk", atMs: state.timeMs, count: dropped });
  }
}

function registerMiss(state: GameState, letter: LetterState): void {
  const onScreenMatches = state.letters.filter(
    (other) =>
      other.id !== letter.id &&
      other.status === "falling" &&
      other.char === letter.char
  ).length;

  state.missed += 1;
  state.lives = Math.max(0, state.lives - 1);
  state.combo = 0;
  state.missesByChar[letter.char] = (state.missesByChar[letter.char] ?? 0) + 1;

  emit(state, {
    type: "miss",
    atMs: state.timeMs,
    char: letter.char,
    id: letter.id,
    livesLeft: state.lives,
    onScreenMatches,
  });

  if (state.lives <= 0) {
    state.status = "finished";
    emit(state, {
      type: "gameOver",
      atMs: state.timeMs,
      score: state.score,
      spawned: state.spawned,
    });
  }
}

function advanceLetters(state: GameState): void {
  const retained: LetterState[] = [];

  for (const letter of state.letters) {
    if (letter.status === "falling") {
      letter.bottomY += letter.speed * STEP_SECONDS;
      if (letter.bottomY >= 1) {
        letter.bottomY = 1;
        letter.status = "landed";
        letter.landedAtMs = state.timeMs;
        registerMiss(state, letter);
      }
      retained.push(letter);
      continue;
    }

    const settledFor = state.timeMs - (letter.landedAtMs ?? state.timeMs);
    if (settledFor < state.config.landedLingerMs) {
      retained.push(letter);
    }
  }

  state.letters = retained;
}

export function scoreFor(count: number, combo: number): number {
  const base = count * count * 10;
  const multiplier = 1 + Math.min(Math.max(combo - 1, 0), 8) * 0.25;
  return Math.round(base * multiplier);
}

export function createGame(
  seed: number = randomSeed(),
  overrides?: Partial<GameConfig>
): GameState {
  const config = resolveConfig(overrides);
  const state: GameState = {
    status: "playing",
    tick: 0,
    timeMs: 0,
    rng: createRng(seed),
    junkRng: createRng((seed ^ JUNK_SEED_OFFSET) >>> 0),
    config,
    letters: [],
    events: [],
    score: 0,
    combo: 0,
    bestCombo: 0,
    comboExpiresAtMs: 0,
    lives: config.lives,
    level: 1,
    spawned: 0,
    cleared: 0,
    missed: 0,
    misfires: 0,
    nextSpawnAtMs: 0,
    nextLetterId: 1,
    nextJunkId: 1,
    pendingJunk: 0,
    junkReceived: 0,
    junkSent: 0,
    hitsByChar: {},
    missesByChar: {},
  };

  state.nextSpawnAtMs = rollNextSpawnTime(state);
  return state;
}

export function step(state: GameState): GameState {
  if (state.status !== "playing") {
    return state;
  }

  const next = cloneState(state);
  next.tick += 1;
  next.timeMs += STEP_MS;

  advanceLetters(next);
  flushPendingJunk(next);

  while (next.status === "playing" && next.timeMs >= next.nextSpawnAtMs) {
    spawnLetter(next);
    next.nextSpawnAtMs = rollNextSpawnTime(next);
  }

  if (next.combo > 0 && next.timeMs > next.comboExpiresAtMs) {
    next.combo = 0;
  }

  return next;
}

export function stepMany(state: GameState, steps: number): GameState {
  let next = state;
  for (let i = 0; i < steps; i += 1) {
    next = step(next);
  }
  return next;
}

export function pressKey(state: GameState, key: string): GameState {
  if (state.status !== "playing" || key.length !== 1) {
    return state;
  }

  const char = key.toLowerCase();
  if (state.config.letterPool.indexOf(char) === -1) {
    return state;
  }

  const matches = state.letters.filter(
    (letter) => letter.status === "falling" && letter.char === char
  );
  const next = cloneState(state);

  if (matches.length < state.config.minMatch) {
    next.misfires += 1;
    next.combo = 0;
    emit(next, {
      type: "misfire",
      atMs: next.timeMs,
      char,
      onScreen: matches.length,
    });
    return next;
  }

  const clearedIds = new Set(matches.map((letter) => letter.id));
  next.letters = next.letters.filter((letter) => !clearedIds.has(letter.id));
  next.combo = next.timeMs <= next.comboExpiresAtMs ? next.combo + 1 : 1;
  next.bestCombo = Math.max(next.bestCombo, next.combo);
  next.comboExpiresAtMs = next.timeMs + next.config.comboWindowMs;

  const points = scoreFor(matches.length, next.combo);
  const attack = attackSizeFor(matches.length, next.config);
  next.score += points;
  next.cleared += matches.length;
  next.junkSent += attack;
  next.hitsByChar[char] = (next.hitsByChar[char] ?? 0) + matches.length;

  emit(next, {
    type: "clear",
    atMs: next.timeMs,
    char,
    count: matches.length,
    points,
    combo: next.combo,
    attack,
  });

  return next;
}

export function attackSizeFor(count: number, config: GameConfig): number {
  if (count < config.attackThreshold) {
    return 0;
  }
  return Math.min(count - config.attackThreshold + 1, config.maxAttackLetters);
}

export function queueJunk(state: GameState, count: number): GameState {
  if (state.status === "finished" || count <= 0) {
    return state;
  }

  const next = cloneState(state);
  next.pendingJunk = Math.min(next.pendingJunk + count, MAX_PENDING_JUNK);
  return next;
}

export function togglePause(state: GameState): GameState {
  if (state.status === "finished") {
    return state;
  }
  const next = cloneState(state);
  next.status = state.status === "playing" ? "paused" : "playing";
  return next;
}

export function pauseGame(state: GameState): GameState {
  if (state.status !== "playing") {
    return state;
  }
  const next = cloneState(state);
  next.status = "paused";
  return next;
}

export function drainEvents(state: GameState): {
  state: GameState;
  events: GameEvent[];
} {
  if (state.events.length === 0) {
    return { state, events: [] };
  }
  const next = cloneState(state);
  const events = next.events;
  next.events = [];
  return { state: next, events };
}

export function countMatchesOnScreen(state: GameState, char: string): number {
  return state.letters.filter(
    (letter) => letter.status === "falling" && letter.char === char
  ).length;
}

export function hasClearableMatch(state: GameState, char: string): boolean {
  return countMatchesOnScreen(state, char) >= state.config.minMatch;
}
