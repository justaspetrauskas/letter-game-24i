import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createGame, stepMany } from "@letter-game/engine";
import type { GameEvent, GameState, LetterState } from "@letter-game/engine";
import { useBursts, CLEAR_BURST_MS } from "@/hooks/useBursts";

function stateWithLetters(letters: LetterState[]): GameState {
  const base = createGame(1);
  return { ...base, letters };
}

function letter(overrides: Partial<LetterState> = {}): LetterState {
  return {
    id: "L1",
    char: "s",
    centerX: 0.4,
    bottomY: 0.5,
    size: 0.14,
    speed: 0.05,
    hue: 120,
    status: "falling",
    kind: "normal",
    spawnedAtMs: 0,
    landedAtMs: null,
    ...overrides,
  };
}

const clearEvent = (count: number, atMs = 1000): GameEvent => ({
  type: "clear",
  atMs,
  char: "s",
  count,
  points: 40,
  combo: 1,
  attack: 0,
});

describe("useBursts", () => {
  it("places one burst per cleared letter, using the pre-clear positions", () => {
    const previous = stateWithLetters([
      letter({ id: "L1", centerX: 0.2, bottomY: 0.4 }),
      letter({ id: "L2", centerX: 0.7, bottomY: 0.6 }),
    ]);

    const { result } = renderHook(() => useBursts());

    act(() => result.current.capture([clearEvent(2)], previous));

    expect(result.current.bursts.length).toEqual(2);
    expect(result.current.bursts.map((burst) => burst.x)).toEqual([0.2, 0.7]);
    expect(result.current.bursts.every((burst) => burst.kind === "clear")).toBe(
      true
    );
  });

  it("marks only one burst per clear as the callout lead", () => {
    const previous = stateWithLetters([
      letter({ id: "L1" }),
      letter({ id: "L2", centerX: 0.6 }),
      letter({ id: "L3", centerX: 0.8 }),
    ]);

    const { result } = renderHook(() => useBursts());

    act(() => result.current.capture([clearEvent(3)], previous));

    expect(result.current.bursts.filter((burst) => burst.lead).length).toEqual(
      1
    );
  });

  it("ignores letters of other characters", () => {
    const previous = stateWithLetters([
      letter({ id: "L1", char: "s" }),
      letter({ id: "L2", char: "k" }),
    ]);

    const { result } = renderHook(() => useBursts());

    act(() => result.current.capture([clearEvent(1)], previous));

    expect(result.current.bursts.length).toEqual(1);
  });

  it("raises a dud burst at the letter that was missed", () => {
    const previous = stateWithLetters([
      letter({ id: "L7", centerX: 0.33, bottomY: 0.98 }),
    ]);
    const miss: GameEvent = {
      type: "miss",
      atMs: 500,
      char: "s",
      id: "L7",
      livesLeft: 19,
      onScreenMatches: 0,
    };

    const { result } = renderHook(() => useBursts());

    act(() => result.current.capture([miss], previous));

    expect(result.current.bursts.length).toEqual(1);
    expect(result.current.bursts[0].kind).toEqual("dud");
    expect(result.current.bursts[0].x).toEqual(0.33);
  });

  it("raises one shake per clear, not one per letter", () => {
    const previous = stateWithLetters([
      letter({ id: "L1" }),
      letter({ id: "L2", centerX: 0.6 }),
      letter({ id: "L3", centerX: 0.8 }),
    ]);

    const { result } = renderHook(() => useBursts());

    act(() => result.current.capture([clearEvent(3)], previous));

    expect(result.current.shakes.length).toEqual(1);
    expect(result.current.shakes[0].magnitude).toEqual(3);
  });

  it("drops bursts that have burned out by the time the next one lands", () => {
    const previous = stateWithLetters([letter({ id: "L1" })]);

    const { result } = renderHook(() => useBursts());

    act(() => result.current.capture([clearEvent(1, 1000)], previous));
    act(() =>
      result.current.capture(
        [clearEvent(1, 1000 + CLEAR_BURST_MS + 50)],
        previous
      )
    );

    expect(result.current.bursts.length).toEqual(1);
  });

  it("keeps bursts that are still burning", () => {
    const previous = stateWithLetters([letter({ id: "L1" })]);

    const { result } = renderHook(() => useBursts());

    act(() => result.current.capture([clearEvent(1, 1000)], previous));
    act(() => result.current.capture([clearEvent(1, 1100)], previous));

    expect(result.current.bursts.length).toEqual(2);
  });

  it("clears everything on reset so a restart cannot inherit old bursts", () => {
    const previous = stateWithLetters([letter({ id: "L1" })]);

    const { result } = renderHook(() => useBursts());

    act(() => result.current.capture([clearEvent(2)], previous));
    expect(result.current.bursts.length).toBeGreaterThan(0);

    act(() => result.current.reset());

    expect(result.current.bursts).toEqual([]);
    expect(result.current.shakes).toEqual([]);
  });

  it("gives every burst a distinct id so React keys stay stable", () => {
    const previous = stateWithLetters([
      letter({ id: "L1" }),
      letter({ id: "L2", centerX: 0.6 }),
    ]);

    const { result } = renderHook(() => useBursts());

    act(() => result.current.capture([clearEvent(2, 1000)], previous));
    act(() => result.current.capture([clearEvent(2, 1100)], previous));

    const ids = result.current.bursts.map((burst) => burst.id);
    expect(new Set(ids).size).toEqual(ids.length);
  });

  it("reads positions off a real engine state", () => {
    const played = stepMany(createGame(3, { letterPool: "a" }), 240);
    const target = played.letters.find(
      (item) => item.status === "falling"
    ) as LetterState;

    const { result } = renderHook(() => useBursts());

    const event: GameEvent = {
      type: "clear",
      atMs: played.timeMs,
      char: target.char,
      count: 1,
      points: 10,
      combo: 1,
      attack: 0,
    };

    act(() => result.current.capture([event], played));

    expect(result.current.bursts.length).toBeGreaterThan(0);
    expect(result.current.bursts[0].size).toEqual(target.size);
  });
});
