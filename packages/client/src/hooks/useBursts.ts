import { useCallback, useRef, useState } from "react";
import type { GameEvent, GameState, LetterState } from "@letter-game/engine";
import { pseudoRandom } from "@/components/Game/GameMotion";

export const CLEAR_BURST_MS = 720;

export const DUD_BURST_MS = 520;

export const SHAKE_MS = 460;

const MAX_BURSTS = 14;

const MAX_SHAKES = 4;

const SHARDS_PER_BURST = 8;

const MAX_SHAKE_LETTERS = 6;

export interface BurstShard {
  angle: number;
  speed: number;
  spin: number;
  scale: number;
}

export interface Burst {
  id: number;
  kind: "clear" | "dud";
  atMs: number;
  x: number;
  y: number;
  size: number;
  count: number;
  lead: boolean;
  shards: BurstShard[];
}

export interface Shake {
  atMs: number;
  magnitude: number;
}

export interface UseBurstsResult {
  bursts: Burst[];
  shakes: Shake[];
  capture: (events: GameEvent[], previous: GameState) => void;
  reset: () => void;
}

function buildShards(id: number): BurstShard[] {
  const shards: BurstShard[] = [];
  for (let index = 0; index < SHARDS_PER_BURST; index += 1) {
    const seed = id * 37 + index;
    shards.push({
      angle: pseudoRandom(seed) * Math.PI * 2,
      speed: 0.9 + pseudoRandom(seed + 101) * 1.5,
      spin: (pseudoRandom(seed + 211) - 0.5) * 1080,
      scale: 0.16 + pseudoRandom(seed + 307) * 0.16,
    });
  }
  return shards;
}

export function useBursts(): UseBurstsResult {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [shakes, setShakes] = useState<Shake[]>([]);
  const nextIdRef = useRef(1);

  const reset = useCallback(() => {
    setBursts([]);
    setShakes([]);
  }, []);

  const capture = useCallback((events: GameEvent[], previous: GameState) => {
    const added: Burst[] = [];
    const addedShakes: Shake[] = [];

    const makeBurst = (
      kind: Burst["kind"],
      atMs: number,
      letter: LetterState,
      count: number,
      lead: boolean
    ): Burst => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;
      return {
        id,
        kind,
        atMs,
        x: letter.centerX,
        y: letter.bottomY - letter.size / 2,
        size: letter.size,
        count,
        lead,
        shards: buildShards(id),
      };
    };

    let latestMs = 0;

    for (const event of events) {
      latestMs = Math.max(latestMs, event.atMs);

      if (event.type === "clear") {
        const hits = previous.letters.filter(
          (letter) => letter.status === "falling" && letter.char === event.char
        );
        hits.forEach((letter, index) => {
          added.push(
            makeBurst("clear", event.atMs, letter, event.count, index === 0)
          );
        });
        addedShakes.push({
          atMs: event.atMs,
          magnitude: Math.min(event.count, MAX_SHAKE_LETTERS),
        });
        continue;
      }

      if (event.type === "miss") {
        const letter = previous.letters.find((item) => item.id === event.id);
        if (letter !== undefined) {
          added.push(makeBurst("dud", event.atMs, letter, 1, true));
        }
      }
    }

    if (added.length === 0 && addedShakes.length === 0) {
      return;
    }

    if (added.length > 0) {
      setBursts((current) =>
        [
          ...current.filter(
            (burst) =>
              burst.atMs <= latestMs && latestMs - burst.atMs < CLEAR_BURST_MS
          ),
          ...added,
        ].slice(-MAX_BURSTS)
      );
    }

    if (addedShakes.length > 0) {
      setShakes((current) =>
        [
          ...current.filter(
            (shake) =>
              shake.atMs <= latestMs && latestMs - shake.atMs < SHAKE_MS
          ),
          ...addedShakes,
        ].slice(-MAX_SHAKES)
      );
    }
  }, []);

  return { bursts, shakes, capture, reset };
}
