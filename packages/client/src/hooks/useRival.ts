import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACCESS_KEY_HEADER,
  MAX_BUFFERED_EVENTS,
  RIVAL_HISTORY_SIZE,
  RIVAL_MIN_INTERVAL_MS,
  RIVAL_WINDOW_MS,
  sanitiseRivalLine,
  shouldCommentate,
  summariseEvents,
} from "@letter-game/protocol";
import type { GameEvent } from "@letter-game/engine";

const TICK_MS = 1000;

export interface UseRivalOptions {
  enabled: boolean;
  accessKey?: string | null;
}

export interface UseRivalResult {
  line: string | null;
  muted: boolean;
  thinking: boolean;
  toggleMute: () => void;
  observe: (events: GameEvent[]) => void;
}

export function useRival(options: UseRivalOptions): UseRivalResult {
  const [line, setLine] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [thinking, setThinking] = useState(false);

  const bufferRef = useRef<GameEvent[]>([]);
  const historyRef = useRef<string[]>([]);
  const windowStartRef = useRef(Date.now());
  const lastLineAtRef = useRef(0);
  const inFlightRef = useRef(false);
  const enabledRef = useRef(options.enabled);
  const accessKeyRef = useRef(options.accessKey ?? null);
  const mutedRef = useRef(muted);

  useEffect(() => {
    enabledRef.current = options.enabled;
  }, [options.enabled]);

  useEffect(() => {
    accessKeyRef.current = options.accessKey ?? null;
  }, [options.accessKey]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const observe = useCallback((events: GameEvent[]) => {
    if (events.length === 0) {
      return;
    }
    const buffer = bufferRef.current;
    buffer.push(...events);
    if (buffer.length > MAX_BUFFERED_EVENTS) {
      buffer.splice(0, buffer.length - MAX_BUFFERED_EVENTS);
    }
  }, []);

  useEffect(() => {
    const tick = (): void => {
      if (!enabledRef.current || mutedRef.current) {
        bufferRef.current = [];
        return;
      }

      const buffer = bufferRef.current;
      if (buffer.length === 0 || inFlightRef.current) {
        return;
      }

      const now = Date.now();
      const endsGame = buffer.some((event) => event.type === "gameOver");
      if (!endsGame && now - windowStartRef.current < RIVAL_WINDOW_MS) {
        return;
      }

      const snapshot = summariseEvents(buffer);
      bufferRef.current = [];
      windowStartRef.current = now;

      if (!shouldCommentate(snapshot)) {
        return;
      }
      if (now - lastLineAtRef.current < RIVAL_MIN_INTERVAL_MS) {
        return;
      }

      inFlightRef.current = true;
      setThinking(true);

      const key = accessKeyRef.current;

      fetch("/api/commentary", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(key === null ? {} : { [ACCESS_KEY_HEADER]: key }),
        },
        body: JSON.stringify({
          snapshot,
          recentLines: historyRef.current,
        }),
      })
        .then(async (response) => {
          if (response.status === 204 || !response.ok) {
            return null;
          }
          const body = await response.json();
          return sanitiseRivalLine(body?.line);
        })
        .then((next) => {
          if (next === null || next.length === 0) {
            return;
          }
          lastLineAtRef.current = Date.now();
          historyRef.current = [...historyRef.current, next].slice(
            -RIVAL_HISTORY_SIZE
          );
          setLine(next);
        })
        .catch(() => undefined)
        .finally(() => {
          inFlightRef.current = false;
          setThinking(false);
        });
    };

    const timer = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((current) => !current);
  }, []);

  return { line, muted, thinking, toggleMute, observe };
}
