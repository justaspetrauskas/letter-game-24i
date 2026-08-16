import { describe, expect, it } from "vitest";
import {
  attackSizeFor,
  createGame,
  drainEvents,
  pressKey,
  queueJunk,
  scoreFor,
  step,
  stepMany,
  togglePause,
} from "./engine";
import { defaultConfig, MAX_PENDING_JUNK } from "./config";
import { GameConfig, GameState } from "./types";

function stepUntil(
  state: GameState,
  predicate: (candidate: GameState) => boolean,
  maxSteps = 4000
): GameState {
  let current = state;
  for (let i = 0; i < maxSteps; i += 1) {
    if (predicate(current)) {
      return current;
    }
    current = step(current);
  }
  return current;
}

const singleLetterRound: Partial<GameConfig> = {
  letterPool: "a",
  spawnDelayMs: [200, 200],
  spawnDelaySpeedupPerLevel: 1,
  fallSpeed: [0.5, 0.5],
  fallSpeedPerLevel: 0,
  letterSize: [0.12, 0.12],
  lives: 3,
};

describe("determinism", () => {
  it("produces identical state for the same seed", () => {
    const a = stepMany(createGame(1234), 900);
    const b = stepMany(createGame(1234), 900);

    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it("diverges for different seeds", () => {
    const a = stepMany(createGame(1234), 900);
    const b = stepMany(createGame(9876), 900);

    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
  });

  it("does not mutate the input state", () => {
    const original = createGame(42);
    const snapshot = JSON.stringify(original);

    stepMany(original, 300);

    expect(JSON.stringify(original)).toEqual(snapshot);
  });

  it("round-trips through JSON", () => {
    const state = stepMany(createGame(7), 400);
    const revived: GameState = JSON.parse(JSON.stringify(state));

    expect(JSON.stringify(stepMany(revived, 120))).toEqual(
      JSON.stringify(stepMany(state, 120))
    );
  });
});

describe("simulation", () => {
  it("spawns letters over time", () => {
    const state = stepMany(createGame(5), 600);

    expect(state.spawned).toBeGreaterThan(0);
    expect(state.letters.length).toBeGreaterThan(0);
  });

  it("moves falling letters downward", () => {
    const spawned = stepUntil(createGame(5), (s) => s.letters.length > 0);
    const tracked = spawned.letters[0];
    const later = stepMany(spawned, 30);
    const same = later.letters.find((letter) => letter.id === tracked.id);

    expect(same).toBeDefined();
    expect(same!.bottomY).toBeGreaterThan(tracked.bottomY);
  });

  it("costs a life when a letter lands", () => {
    const game = createGame(3, singleLetterRound);
    const landed = stepUntil(game, (s) => s.missed > 0);

    expect(landed.lives).toEqual(2);
    expect(landed.missesByChar.a).toEqual(1);
    expect(landed.events.some((event) => event.type === "miss")).toBe(true);
  });

  it("finishes the game when lives run out", () => {
    const game = createGame(3, singleLetterRound);
    const over = stepUntil(game, (s) => s.status === "finished");

    expect(over.status).toEqual("finished");
    expect(over.lives).toEqual(0);
    expect(over.events.some((event) => event.type === "gameOver")).toBe(true);
  });

  it("ignores steps while paused", () => {
    const running = stepMany(createGame(11), 200);
    const paused = togglePause(running);

    expect(paused.status).toEqual("paused");
    expect(stepMany(paused, 100).timeMs).toEqual(paused.timeMs);
  });

  it("raises the level as letters accumulate", () => {
    const game = createGame(3, {
      ...singleLetterRound,
      lives: 999,
      spawnsPerLevel: 3,
    });
    const levelled = stepUntil(game, (s) => s.level > 1);

    expect(levelled.level).toBeGreaterThan(1);
    expect(levelled.events.some((event) => event.type === "levelUp")).toBe(true);
  });
});

describe("input", () => {
  it("clears every matching letter and scores once", () => {
    const game = createGame(3, singleLetterRound);
    const ready = stepUntil(game, (s) => s.letters.length >= 2);
    const pressed = pressKey(ready, "a");

    expect(pressed.letters.length).toEqual(0);
    expect(pressed.score).toBeGreaterThan(0);
    expect(pressed.cleared).toBeGreaterThanOrEqual(2);
    expect(pressed.hitsByChar.a).toBeGreaterThanOrEqual(2);
  });

  it("records a misfire below the match threshold", () => {
    const game = createGame(3, singleLetterRound);
    const single = stepUntil(game, (s) => s.letters.length === 1);
    const pressed = pressKey(single, "a");

    expect(pressed.score).toEqual(0);
    expect(pressed.misfires).toEqual(1);
    expect(pressed.letters.length).toEqual(1);
    expect(pressed.events.some((event) => event.type === "misfire")).toBe(true);
  });

  it("ignores keys outside the letter pool", () => {
    const game = stepMany(createGame(3, singleLetterRound), 200);

    expect(pressKey(game, "z")).toBe(game);
  });

  it("ignores input once the game is finished", () => {
    const over = stepUntil(
      createGame(3, singleLetterRound),
      (s) => s.status === "finished"
    );

    expect(pressKey(over, "a")).toBe(over);
  });

  it("rewards larger clears superlinearly", () => {
    expect(scoreFor(4, 1)).toBeGreaterThan(scoreFor(2, 1) * 2);
  });

  it("applies a combo multiplier to consecutive clears", () => {
    expect(scoreFor(2, 3)).toBeGreaterThan(scoreFor(2, 1));
  });
});

describe("events", () => {
  it("drains the buffer", () => {
    const state = stepMany(createGame(21), 600);
    const drained = drainEvents(state);

    expect(drained.events.length).toBeGreaterThan(0);
    expect(drained.state.events.length).toEqual(0);
  });

  it("caps retained events", () => {
    const state = stepMany(createGame(21, { maxRetainedEvents: 8 }), 3000);

    expect(state.events.length).toBeLessThanOrEqual(8);
  });
});

describe("attacks", () => {
  const junkRound: Partial<GameConfig> = {
    ...singleLetterRound,
    lives: 99,
  };

  it("earns an attack only at the threshold", () => {
    const config = { ...defaultConfig, attackThreshold: 4, maxAttackLetters: 5 };

    expect(attackSizeFor(3, config)).toEqual(0);
    expect(attackSizeFor(4, config)).toEqual(1);
    expect(attackSizeFor(6, config)).toEqual(3);
  });

  it("caps how much a single clear can send", () => {
    const config = { ...defaultConfig, attackThreshold: 4, maxAttackLetters: 2 };

    expect(attackSizeFor(20, config)).toEqual(2);
  });

  it("reports the attack on the clear event", () => {
    const game = createGame(3, { ...junkRound, attackThreshold: 2 });
    const ready = stepUntil(game, (s) => s.letters.length >= 2);
    const pressed = pressKey(ready, "a");
    const cleared = pressed.events.find((event) => event.type === "clear");

    expect(cleared?.type).toEqual("clear");
    if (cleared?.type !== "clear") return;
    expect(cleared.attack).toBeGreaterThan(0);
    expect(pressed.junkSent).toEqual(cleared.attack);
  });

  it("drops queued junk onto the board", () => {
    const game = stepMany(createGame(5, junkRound), 60);
    const queued = queueJunk(game, 3);

    expect(queued.pendingJunk).toEqual(3);

    const landed = step(queued);
    const junk = landed.letters.filter((letter) => letter.kind === "junk");

    expect(junk).toHaveLength(3);
    expect(landed.junkReceived).toEqual(3);
    expect(landed.pendingJunk).toEqual(0);
    expect(landed.events.some((event) => event.type === "junk")).toBe(true);
  });

  it("leaves the shared sequence untouched", () => {
    const untouched = stepMany(createGame(99, junkRound), 600);
    const attacked = stepMany(
      queueJunk(stepMany(createGame(99, junkRound), 300), 5),
      300
    );

    const normalIds = (state: GameState) =>
      state.letters
        .filter((letter) => letter.kind === "normal")
        .map((letter) => letter.id);

    expect(attacked.rng.seed).toEqual(untouched.rng.seed);
    expect(normalIds(attacked)).toEqual(normalIds(untouched));
    expect(attacked.spawned).toEqual(untouched.spawned);
  });

  it("does not let junk drive the level up", () => {
    const game = stepMany(createGame(7, junkRound), 60);
    const before = game.spawned;
    const after = step(queueJunk(game, 5));

    expect(after.spawned).toEqual(before);
  });

  it("costs a life when junk lands", () => {
    const game = stepMany(createGame(11, junkRound), 60);
    const attacked = step(queueJunk(game, 2));
    const settled = stepUntil(attacked, (s) => s.missed > 0);

    expect(settled.lives).toBeLessThan(99);
  });

  it("respects the on-screen ceiling", () => {
    const game = stepMany(
      createGame(13, { ...junkRound, maxLettersOnScreen: 4 }),
      60
    );
    const after = step(queueJunk(game, 20));

    expect(after.letters.length).toBeLessThanOrEqual(4);
    expect(after.pendingJunk).toBeGreaterThan(0);
  });

  it("caps how much junk can be queued", () => {
    const game = createGame(3, junkRound);

    expect(queueJunk(game, 9999).pendingJunk).toEqual(MAX_PENDING_JUNK);
  });

  it("ignores junk once the game is over", () => {
    const over = stepUntil(
      createGame(3, singleLetterRound),
      (s) => s.status === "finished"
    );

    expect(queueJunk(over, 3)).toBe(over);
  });

  it("ignores a non-positive amount", () => {
    const game = createGame(3, junkRound);

    expect(queueJunk(game, 0)).toBe(game);
  });
});
