import { useCallback, useEffect, useRef, useState } from "react";
import { isValidTheme, sanitiseTheme } from "@letter-game/protocol";
import type { CapabilitiesResponse, ThemedRound } from "@letter-game/protocol";

export type RoundStatus = "idle" | "loading" | "error";

export interface UseThemedRoundOptions {
  onRound?: (round: ThemedRound) => void;
}

export interface UseThemedRoundResult {
  serverReachable: boolean;
  available: boolean;
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
  const [serverReachable, setServerReachable] = useState(false);
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState<RoundStatus>("idle");
  const [round, setRound] = useState<ThemedRound | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onRoundRef = useRef(options.onRound);

  useEffect(() => {
    onRoundRef.current = options.onRound;
  }, [options.onRound]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/capabilities")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: CapabilitiesResponse | null) => {
        if (cancelled || body === null) {
          return;
        }
        setServerReachable(true);
        setAvailable(body.ai === true);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const generate = useCallback((rawTheme: string) => {
    if (!isValidTheme(rawTheme)) {
      setStatus("error");
      setError("Enter a theme first.");
      return;
    }

    setStatus("loading");
    setError(null);

    fetch("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
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

  return { serverReachable, available, status, round, error, generate };
}
