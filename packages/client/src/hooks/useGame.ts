import { useCallback, useEffect, useRef, useState } from "react";
import {
  createGame,
  drainEvents,
  pauseGame,
  pressKey,
  queueJunk,
  randomSeed,
  step,
  togglePause,
  MAX_CATCHUP_STEPS,
  STEP_MS,
} from "@letter-game/engine";
import type { GameConfig, GameEvent, GameState } from "@letter-game/engine";

interface UseGameOptions {
  seed?: number;
  config?: Partial<GameConfig>;
  onEvents?: (events: GameEvent[]) => void;
  enabled?: boolean;
}

export interface RestartOptions {
  seed?: number;
  config?: Partial<GameConfig>;
}

export interface UseGameResult {
  state: GameState;
  press: (key: string) => void;
  toggle: () => void;
  restart: (options?: RestartOptions) => void;
  receiveJunk: (count: number) => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA"
  );
}

export function useGame(options: UseGameOptions = {}): UseGameResult {
  const { seed, config, onEvents, enabled = true } = options;

  const stateRef = useRef<GameState | null>(null);
  if (stateRef.current === null) {
    stateRef.current = createGame(seed ?? randomSeed(), config);
  }

  const [snapshot, setSnapshot] = useState<GameState>(stateRef.current);

  const onEventsRef = useRef(onEvents);
  const configRef = useRef(config);

  useEffect(() => {
    onEventsRef.current = onEvents;
  }, [onEvents]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const commit = useCallback((next: GameState) => {
    const drained = drainEvents(next);
    if (drained.events.length > 0 && onEventsRef.current) {
      onEventsRef.current(drained.events);
    }
    stateRef.current = drained.state;
    setSnapshot(drained.state);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frame = 0;
    let lastFrameAt = performance.now();
    let accumulator = 0;

    const runFrame = (now: number) => {
      const elapsed = Math.min(
        now - lastFrameAt,
        STEP_MS * MAX_CATCHUP_STEPS
      );
      lastFrameAt = now;
      accumulator += elapsed;

      let next = stateRef.current as GameState;
      let steps = 0;
      while (accumulator >= STEP_MS && steps < MAX_CATCHUP_STEPS) {
        next = step(next);
        accumulator -= STEP_MS;
        steps += 1;
      }

      if (accumulator > STEP_MS) {
        accumulator = 0;
      }

      if (next !== stateRef.current) {
        commit(next);
      }

      frame = requestAnimationFrame(runFrame);
    };

    frame = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(frame);
  }, [commit, enabled]);

  const press = useCallback(
    (key: string) => {
      commit(pressKey(stateRef.current as GameState, key));
    },
    [commit]
  );

  const receiveJunk = useCallback(
    (count: number) => {
      commit(queueJunk(stateRef.current as GameState, count));
    },
    [commit]
  );

  const toggle = useCallback(() => {
    commit(togglePause(stateRef.current as GameState));
  }, [commit]);

  const restart = useCallback(
    (options?: RestartOptions) => {
      const nextConfig = options?.config ?? configRef.current;
      configRef.current = nextConfig;
      commit(createGame(options?.seed ?? randomSeed(), nextConfig));
    },
    [commit]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }
      if (event.key === "Escape" || event.key === " ") {
        event.preventDefault();
        toggle();
        return;
      }
      press(event.key);
    };

    const handleBlur = () => {
      commit(pauseGame(stateRef.current as GameState));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
    };
  }, [press, toggle, commit, enabled]);

  return { state: snapshot, press, toggle, restart, receiveJunk };
}

