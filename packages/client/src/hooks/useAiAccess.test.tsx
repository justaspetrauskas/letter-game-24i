import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ACCESS_KEY_HEADER } from "@letter-game/protocol";
import type { CapabilitiesResponse } from "@letter-game/protocol";
import { ACCESS_KEY_STORAGE, useAiAccess } from "@/hooks/useAiAccess";

const ISSUED_KEY = "press-start";

const seenKeys: Array<string | null> = [];

function offeredKey(init: RequestInit | undefined): string | null {
  const headers = (init?.headers ?? {}) as Record<string, string>;
  return headers[ACCESS_KEY_HEADER] ?? null;
}

function respondWith(
  reply: (key: string | null) => CapabilitiesResponse
): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      const key = offeredKey(init);
      seenKeys.push(key);
      return {
        ok: true,
        json: async () => reply(key),
      } as Response;
    })
  );
}

function lockedServer(key: string | null): CapabilitiesResponse {
  return { ai: true, locked: true, unlocked: key === ISSUED_KEY };
}

beforeEach(() => {
  seenKeys.length = 0;
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAiAccess", () => {
  it("is ready when the server has ai and asks for no key", async () => {
    respondWith(() => ({ ai: true, locked: false, unlocked: true }));

    const { result } = renderHook(() => useAiAccess());

    await waitFor(() => expect(result.current.ready).toEqual(true));
    expect(result.current.locked).toEqual(false);
    expect(result.current.key).toBeNull();
  });

  it("is locked, configured and not ready without a key", async () => {
    respondWith(lockedServer);

    const { result } = renderHook(() => useAiAccess());

    await waitFor(() => expect(result.current.serverReachable).toEqual(true));
    expect(result.current.configured).toEqual(true);
    expect(result.current.locked).toEqual(true);
    expect(result.current.ready).toEqual(false);
  });

  it("stays locked when the server cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("down"))));

    const { result } = renderHook(() => useAiAccess());

    await waitFor(() => expect(result.current.ready).toEqual(false));
    expect(result.current.serverReachable).toEqual(false);
  });

  it("replays a stored key and comes back ready", async () => {
    window.localStorage.setItem(ACCESS_KEY_STORAGE, ISSUED_KEY);
    respondWith(lockedServer);

    const { result } = renderHook(() => useAiAccess());

    await waitFor(() => expect(result.current.ready).toEqual(true));
    expect(seenKeys).toEqual([ISSUED_KEY]);
    expect(result.current.key).toEqual(ISSUED_KEY);
  });

  it("drops a stored key the server no longer accepts", async () => {
    window.localStorage.setItem(ACCESS_KEY_STORAGE, "revoked");
    respondWith(lockedServer);

    const { result } = renderHook(() => useAiAccess());

    await waitFor(() => expect(result.current.serverReachable).toEqual(true));
    expect(result.current.ready).toEqual(false);
    expect(result.current.key).toBeNull();
    expect(window.localStorage.getItem(ACCESS_KEY_STORAGE)).toBeNull();
  });

  it("keeps a working key from the unlock form", async () => {
    respondWith(lockedServer);

    const { result } = renderHook(() => useAiAccess());
    await waitFor(() => expect(result.current.serverReachable).toEqual(true));

    act(() => result.current.unlock(` ${ISSUED_KEY} `));

    await waitFor(() => expect(result.current.ready).toEqual(true));
    expect(window.localStorage.getItem(ACCESS_KEY_STORAGE)).toEqual(ISSUED_KEY);
    expect(result.current.error).toBeNull();
  });

  it("reports a key the server refuses and stores nothing", async () => {
    respondWith(lockedServer);

    const { result } = renderHook(() => useAiAccess());
    await waitFor(() => expect(result.current.serverReachable).toEqual(true));

    act(() => result.current.unlock("guessing"));

    await waitFor(() => expect(result.current.status).toEqual("error"));
    expect(result.current.ready).toEqual(false);
    expect(result.current.error).toEqual("That key was not recognised.");
    expect(window.localStorage.getItem(ACCESS_KEY_STORAGE)).toBeNull();
  });

  it("refuses a blank key without asking the server", async () => {
    respondWith(lockedServer);

    const { result } = renderHook(() => useAiAccess());
    await waitFor(() => expect(result.current.serverReachable).toEqual(true));
    const before = seenKeys.length;

    act(() => result.current.unlock("   "));

    expect(result.current.status).toEqual("error");
    expect(seenKeys).toHaveLength(before);
  });

  it("locks again once the key is forgotten", async () => {
    window.localStorage.setItem(ACCESS_KEY_STORAGE, ISSUED_KEY);
    respondWith(lockedServer);

    const { result } = renderHook(() => useAiAccess());
    await waitFor(() => expect(result.current.ready).toEqual(true));

    act(() => result.current.forget());

    expect(result.current.ready).toEqual(false);
    expect(result.current.key).toBeNull();
    expect(window.localStorage.getItem(ACCESS_KEY_STORAGE)).toBeNull();
  });
});
