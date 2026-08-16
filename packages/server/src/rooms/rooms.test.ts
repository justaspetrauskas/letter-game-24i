import { describe, expect, it } from "vitest";
import { RoomRegistry } from "@/rooms/rooms";

function makeRegistry(codes: string[] = ["AAAA", "BBBB", "CCCC"]) {
  let codeIndex = 0;
  let clock = 1000;

  return new RoomRegistry({
    now: () => {
      clock += 10;
      return clock;
    },
    makeSeed: () => 4242,
    makeCode: () => codes[Math.min(codeIndex++, codes.length - 1)],
    maxPlayers: 3,
  });
}

describe("room creation", () => {
  it("creates a room with the creator as host", () => {
    const registry = makeRegistry();
    const result = registry.create("p1", "Justas");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.room.code).toEqual("AAAA");
    expect(result.room.seed).toEqual(4242);
    expect(result.room.players).toHaveLength(1);
    expect(result.room.players[0].isHost).toBe(true);
    expect(result.room.players[0].name).toEqual("Justas");
  });

  it("rejects a blank player name", () => {
    const registry = makeRegistry();
    const result = registry.create("p1", "   ");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual("invalid_name");
  });

  it("sanitises a hostile config", () => {
    const registry = makeRegistry();
    const result = registry.create("p1", "Justas", {
      letterPool: "!!!!",
      minMatch: 999,
      lives: -5,
      spawnDelayMs: [9000, 100],
      somethingElse: "ignored",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.room.config.letterPool).toBeUndefined();
    expect(result.room.config.minMatch).toEqual(5);
    expect(result.room.config.lives).toEqual(1);
    expect(result.room.config.spawnDelayMs).toEqual([150, 9000]);
    expect(result.room.config).not.toHaveProperty("somethingElse");
  });

  it("moves a player out of their previous room", () => {
    const registry = makeRegistry();
    registry.create("p1", "Justas");
    registry.create("p1", "Justas");

    expect(registry.roomCount).toEqual(1);
    expect(registry.roomOf("p1")).toEqual("BBBB");
  });
});

describe("joining", () => {
  it("shares the same seed with everyone in the room", () => {
    const registry = makeRegistry();
    const created = registry.create("p1", "Host");
    if (!created.ok) throw new Error("setup failed");

    const joined = registry.join("p2", created.room.code, "Guest");

    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    expect(joined.room.seed).toEqual(created.room.seed);
    expect(joined.room.players).toHaveLength(2);
  });

  it("accepts a lowercase code", () => {
    const registry = makeRegistry();
    registry.create("p1", "Host");

    expect(registry.join("p2", "aaaa", "Guest").ok).toBe(true);
  });

  it("rejects an unknown room", () => {
    const registry = makeRegistry();
    const result = registry.join("p2", "ZZZZ", "Guest");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual("room_not_found");
  });

  it("rejects a malformed code", () => {
    const registry = makeRegistry();
    const result = registry.join("p2", "10", "Guest");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual("invalid_code");
  });

  it("rejects a full room", () => {
    const registry = makeRegistry();
    registry.create("p1", "Host");
    registry.join("p2", "AAAA", "Two");
    registry.join("p3", "AAAA", "Three");

    const result = registry.join("p4", "AAAA", "Four");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual("room_full");
  });

  it("is idempotent for a player already in the room", () => {
    const registry = makeRegistry();
    registry.create("p1", "Host");
    const again = registry.join("p1", "AAAA", "Host");

    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.room.players).toHaveLength(1);
  });
});

describe("leaving", () => {
  it("promotes the next player when the host leaves", () => {
    const registry = makeRegistry();
    registry.create("p1", "Host");
    registry.join("p2", "AAAA", "Guest");

    registry.leave("p1");
    const snapshot = registry.snapshot("AAAA");

    expect(snapshot?.players).toHaveLength(1);
    expect(snapshot?.players[0].id).toEqual("p2");
    expect(snapshot?.players[0].isHost).toBe(true);
  });

  it("deletes the room once the last player leaves", () => {
    const registry = makeRegistry();
    registry.create("p1", "Host");
    registry.leave("p1");

    expect(registry.roomCount).toEqual(0);
    expect(registry.snapshot("AAAA")).toBeNull();
    expect(registry.roomOf("p1")).toBeNull();
  });

  it("is safe to call for an unknown player", () => {
    const registry = makeRegistry();

    expect(registry.leave("ghost")).toBeNull();
  });
});

describe("progress", () => {
  it("starts null and records a report", () => {
    const registry = makeRegistry();
    registry.create("p1", "Host");

    expect(registry.snapshot("AAAA")?.players[0].progress).toBeNull();

    registry.updateProgress("p1", { score: 120, lives: 12, level: 2 });

    expect(registry.snapshot("AAAA")?.players[0].progress).toMatchObject({
      score: 120,
      lives: 12,
      level: 2,
    });
  });

  it("clamps a forged report", () => {
    const registry = makeRegistry();
    registry.create("p1", "Host");
    registry.updateProgress("p1", { score: 1e12 });

    expect(registry.snapshot("AAAA")?.players[0].progress?.score).toEqual(
      9_999_999
    );
  });

  it("returns the room code so the caller can broadcast", () => {
    const registry = makeRegistry();
    registry.create("p1", "Host");

    expect(registry.updateProgress("p1", { score: 1 })).toEqual("AAAA");
  });

  it("ignores a player who is not in a room", () => {
    const registry = makeRegistry();

    expect(registry.updateProgress("ghost", { score: 1 })).toBeNull();
  });

  it("keeps each player's progress separate", () => {
    const registry = makeRegistry();
    registry.create("p1", "Host");
    registry.join("p2", "AAAA", "Guest");

    registry.updateProgress("p1", { score: 10 });
    registry.updateProgress("p2", { score: 90 });

    const players = registry.snapshot("AAAA")?.players ?? [];
    expect(players.find((p) => p.id === "p1")?.progress?.score).toEqual(10);
    expect(players.find((p) => p.id === "p2")?.progress?.score).toEqual(90);
  });
});
