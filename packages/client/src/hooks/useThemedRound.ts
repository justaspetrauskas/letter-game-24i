import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACCESS_KEY_HEADER,
  isValidTheme,
  sanitiseTheme,
} from "@letter-game/protocol";
import type { ThemedRound } from "@letter-game/protocol";

export type RoundStatus = "idle" | "loading" | "error";

export interface UseThemedRoundOptions {
  accessKey?: string | null;
  onRound?: (round: ThemedRound) => void;
}

export interface UseThemedRoundResult {
  status: RoundStatus;
  round: ThemedRound | null;
  error: string | null;
  generate: (theme: string) => void;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.message === "string") {
      return body.message;
    }
  } catch {
    return "Round generation failed.";
  }
  return "Round generation failed.";
}

export function useThemedRound(
  options: UseThemedRoundOptions = {}
): UseThemedRoundResult {
  const [status, setStatus] = useState<RoundStatus>("idle");
  const [round, setRound] = useState<ThemedRound | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onRoundRef = useRef(options.onRound);
  const accessKeyRef = useRef(options.accessKey ?? null);

  useEffect(() => {
    onRoundRef.current = options.onRound;
  }, [options.onRound]);

  useEffect(() => {
    accessKeyRef.current = options.accessKey ?? null;
  }, [options.accessKey]);

  const generate = useCallback((rawTheme: string) => {
    if (!isValidTheme(rawTheme)) {
      setStatus("error");
      setError("Enter a theme first.");
      return;
    }

    setStatus("loading");
    setError(null);

    const key = accessKeyRef.current;

    fetch("/api/rounds", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(key === null ? {} : { [ACCESS_KEY_HEADER]: key }),
      },
      body: JSON.stringify({ theme: sanitiseTheme(rawTheme) }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readError(response));
        }
        return (await response.json()) as ThemedRound;
      })
      .then((generated) => {
        setRound(generated);
        setStatus("idle");
        onRoundRef.current?.(generated);
      })
      .catch((cause: Error) => {
        setStatus("error");
        setError(cause.message || "Round generation failed.");
      });
  }, []);

  return { status, round, error, generate };
}
