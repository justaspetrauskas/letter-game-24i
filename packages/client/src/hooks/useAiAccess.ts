import { useCallback, useEffect, useState } from "react";
import { ACCESS_KEY_HEADER, sanitiseAccessKey } from "@letter-game/protocol";
import type { CapabilitiesResponse } from "@letter-game/protocol";

export const ACCESS_KEY_STORAGE = "letter-game.access-key";

export type AccessStatus = "idle" | "checking" | "error";

export interface UseAiAccessResult {
  serverReachable: boolean;
  configured: boolean;
  locked: boolean;
  ready: boolean;
  key: string | null;
  status: AccessStatus;
  error: string | null;
  unlock: (candidate: string) => void;
  forget: () => void;
}

const UNKNOWN: CapabilitiesResponse = {
  ai: false,
  locked: false,
  unlocked: false,
};

function readStoredKey(): string | null {
  try {
    const stored = sanitiseAccessKey(
      window.localStorage.getItem(ACCESS_KEY_STORAGE)
    );
    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredKey(key: string | null): void {
  try {
    if (key === null) {
      window.localStorage.removeItem(ACCESS_KEY_STORAGE);
      return;
    }
    window.localStorage.setItem(ACCESS_KEY_STORAGE, key);
  } catch {
    return;
  }
}

async function fetchCapabilities(
  key: string | null
): Promise<CapabilitiesResponse | null> {
  try {
    const response = await fetch("/api/capabilities", {
      headers: key === null ? undefined : { [ACCESS_KEY_HEADER]: key },
    });
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as CapabilitiesResponse;
    return {
      ai: body?.ai === true,
      locked: body?.locked === true,
      unlocked: body?.unlocked === true,
    };
  } catch {
    return null;
  }
}

export function useAiAccess(): UseAiAccessResult {
  const [serverReachable, setServerReachable] = useState(false);
  const [caps, setCaps] = useState<CapabilitiesResponse>(UNKNOWN);
  const [key, setKey] = useState<string | null>(null);
  const [status, setStatus] = useState<AccessStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const stored = readStoredKey();

    fetchCapabilities(stored).then((body) => {
      if (cancelled || body === null) {
        return;
      }

      setServerReachable(true);
      setCaps(body);

      if (stored === null) {
        return;
      }
      if (body.locked && !body.unlocked) {
        writeStoredKey(null);
        return;
      }
      setKey(stored);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const unlock = useCallback((raw: string) => {
    const candidate = sanitiseAccessKey(raw);
    if (candidate.length === 0) {
      setStatus("error");
      setError("Enter the key first.");
      return;
    }

    setStatus("checking");
    setError(null);

    fetchCapabilities(candidate).then((body) => {
      if (body === null) {
        setStatus("error");
        setError("Could not reach the server.");
        return;
      }

      setServerReachable(true);
      setCaps(body);

      if (!body.unlocked) {
        setStatus("error");
        setError("That key was not recognised.");
        return;
      }

      writeStoredKey(candidate);
      setKey(candidate);
      setStatus("idle");
    });
  }, []);

  const forget = useCallback(() => {
    writeStoredKey(null);
    setKey(null);
    setStatus("idle");
    setError(null);
    setCaps((current) => ({ ...current, unlocked: !current.locked }));
  }, []);

  return {
    serverReachable,
    configured: caps.ai,
    locked: caps.locked,
    ready: caps.ai && caps.unlocked,
    key,
    status,
    error,
    unlock,
    forget,
  };
}
