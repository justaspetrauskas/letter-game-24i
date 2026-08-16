import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { GameEvent } from "@letter-game/engine";
import { useGame } from "@/hooks/useGame";

const FRAME_MS = 1000 / 60;

let currentTime = 0;
let pendingFrames: FrameRequestCallback[] = [];

beforeEach(() => {
  currentTime = 0;
  pendingFrames = [];

  vi.spyOn(performance, "now").mockImplementation(() => currentTime);
  vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((callback: FrameRequestCallback) => {
      pendingFrames.push(callback);
      return pendingFrames.length;
    });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function runFrames(count: number): void {
  for (let i = 0; i < count; i += 1) {
    const due = pendingFrames;
    pendingFrames = [];
    currentTime += FRAME_MS;
    act(() => {
      due.forEach((callback) => callback(currentTime));
    });
  }
}

function pressKeyboard(key: string): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  });
}

const singleLetterRound = {
  letterPool: "a",
  spawnDelayMs: [200, 200] as [number, number],
  spawnDelaySpeedupPerLevel: 1,
  fallSpeed: [0.3, 0.3] as [number, number],
  fallSpeedPerLevel: 0,
  lives: 5,
};

describe("useGame", () => {
  it("advances the simulation on animation frames", () => {
    const { result } = renderHook(() => useGame({ seed: 1 }));

    expect(result.current.state.timeMs).toEqual(0);

    runFrames(200);

    expect(result.current.state.timeMs).toBeGreaterThan(3000);
    expect(result.current.state.spawned).toBeGreaterThan(0);
  });

  it("does not advance while paused", () => {
    const { result } = renderHook(() => useGame({ seed: 1 }));

    runFrames(60);
    act(() => result.current.toggle());
    const pausedAt = result.current.state.timeMs;

    runFrames(60);

    expect(result.current.state.status).toEqual("paused");
    expect(result.current.state.timeMs).toEqual(pausedAt);
  });

  it("resumes after a second toggle", () => {
    const { result } = renderHook(() => useGame({ seed: 1 }));

    runFrames(30);
    act(() => result.current.toggle());
    act(() => result.current.toggle());
    const resumedAt = result.current.state.timeMs;
    runFrames(30);

    expect(result.current.state.status).toEqual("playing");
    expect(result.current.state.timeMs).toBeGreaterThan(resumedAt);
  });

  it("clears letters from keyboard input", () => {
    const { result } = renderHook(() =>
      useGame({ seed: 3, config: singleLetterRound })
    );

    runFrames(90);
    expect(result.current.state.letters.length).toBeGreaterThanOrEqual(2);

    pressKeyboard("a");

    expect(result.current.state.score).toBeGreaterThan(0);
    expect(result.current.state.cleared).toBeGreaterThanOrEqual(2);
  });

  it("pauses when the window loses focus", () => {
    const { result } = renderHook(() => useGame({ seed: 1 }));

    runFrames(30);
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(result.current.state.status).toEqual("paused");
  });

  it("toggles pause with the escape key", () => {
    const { result } = renderHook(() => useGame({ seed: 1 }));

    runFrames(30);
    pressKeyboard("Escape");

    expect(result.current.state.status).toEqual("paused");
  });

  it("forwards drained events to the listener", () => {
    const received: GameEvent[] = [];
    const handleEvents = (events: GameEvent[]) => {
      received.push(...events);
    };

    const { result } = renderHook(() =>
      useGame({ seed: 3, config: singleLetterRound, onEvents: handleEvents })
    );

    runFrames(120);

    expect(received.some((event) => event.type === "spawn")).toBe(true);
    expect(result.current.state.events.length).toEqual(0);
  });

  it("starts a fresh game on restart", () => {
    const { result } = renderHook(() =>
      useGame({ seed: 3, config: singleLetterRound })
    );

    runFrames(200);
    expect(result.current.state.spawned).toBeGreaterThan(0);

    act(() => result.current.restart());

    expect(result.current.state.timeMs).toEqual(0);
    expect(result.current.state.spawned).toEqual(0);
    expect(result.current.state.status).toEqual("playing");
  });

  it("applies a round preset passed to restart", () => {
    const { result } = renderHook(() => useGame({ seed: 3 }));

    act(() =>
      result.current.restart({ config: { letterPool: "xyz", lives: 7 } })
    );

    expect(result.current.state.config.letterPool).toEqual("xyz");
    expect(result.current.state.lives).toEqual(7);
  });

  it("restarts on a given seed so a room can be replayed exactly", () => {
    const { result } = renderHook(() => useGame({ seed: 1 }));

    act(() => result.current.restart({ seed: 4242 }));
    const first = result.current.state;

    act(() => result.current.restart({ seed: 4242 }));

    expect(result.current.state.rng.seed).toEqual(first.rng.seed);
  });

  it("caps catch-up so a long stall cannot fast-forward the game", () => {
    const { result } = renderHook(() => useGame({ seed: 1 }));

    runFrames(1);
    const due = pendingFrames;
    pendingFrames = [];
    currentTime += 60000;
    act(() => {
      due.forEach((callback) => callback(currentTime));
    });

    expect(result.current.state.timeMs).toBeLessThan(200);
  });
});
