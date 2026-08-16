import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { io as createClient } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  RoomResult,
  RoomSnapshot,
  ServerToClientEvents,
} from "@letter-game/protocol";
import { buildServer } from "@/server/server";
import type { BuiltServer } from "@/server/server";

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let built: BuiltServer;
let url: string;
const openClients: ClientSocket[] = [];

beforeEach(async () => {
  built = buildServer({
    port: 0,
    host: "127.0.0.1",
    clientOrigin: "*",
    anthropicApiKey: null,
    aiModel: "claude-opus-5",
  commentaryModel: "claude-opus-5",
  });
  await built.app.listen({ port: 0, host: "127.0.0.1" });

  const address = built.app.server.address();
  const port = address !== null && typeof address === "object" ? address.port : 0;
  url = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  openClients.forEach((socket) => socket.disconnect());
  openClients.length = 0;
  await built.close();
});

function connect(): Promise<ClientSocket> {
  const socket: ClientSocket = createClient(url, {
    transports: ["websocket"],
    forceNew: true,
  });
  openClients.push(socket);

  return new Promise((resolve, reject) => {
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
  });
}

function createRoom(
  socket: ClientSocket,
  payload: CreateRoomPayload
): Promise<RoomResult> {
  return new Promise((resolve) => {
    socket.emit("room:create", payload, resolve);
  });
}

function joinRoom(
  socket: ClientSocket,
  payload: JoinRoomPayload
): Promise<RoomResult> {
  return new Promise((resolve) => {
    socket.emit("room:join", payload, resolve);
  });
}

function leaveRoom(socket: ClientSocket): Promise<{ ok: boolean }> {
  return new Promise((resolve) => {
    socket.emit("room:leave", resolve);
  });
}

function roomUpdateWhere(
  socket: ClientSocket,
  predicate: (snapshot: RoomSnapshot) => boolean
): Promise<RoomSnapshot> {
  return new Promise((resolve) => {
    const handler = (snapshot: RoomSnapshot): void => {
      if (predicate(snapshot)) {
        socket.off("room:update", handler);
        resolve(snapshot);
      }
    };
    socket.on("room:update", handler);
  });
}

function roomUpdateWithPlayers(
  socket: ClientSocket,
  count: number
): Promise<RoomSnapshot> {
  return roomUpdateWhere(socket, (snapshot) => snapshot.players.length === count);
}

describe("socket rooms", () => {
  it("gives every player in a room the same seed", async () => {
    const host = await connect();
    const guest = await connect();

    const created = await createRoom(host, { name: "Host" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const joined = await joinRoom(guest, {
      code: created.room.code,
      name: "Guest",
    });

    expect(joined.ok).toBe(true);
    if (!joined.ok) return;

    expect(joined.room.seed).toEqual(created.room.seed);
    expect(joined.room.code).toEqual(created.room.code);
  });

  it("tells existing players when someone joins", async () => {
    const host = await connect();
    const guest = await connect();

    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");

    const update = roomUpdateWithPlayers(host, 2);
    await joinRoom(guest, { code: created.room.code, name: "Guest" });

    const snapshot = await update;
    expect(snapshot.players).toHaveLength(2);
    expect(snapshot.players.map((player) => player.name)).toContain("Guest");
  });

  it("tells remaining players when someone leaves", async () => {
    const host = await connect();
    const guest = await connect();

    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");
    await joinRoom(guest, { code: created.room.code, name: "Guest" });

    const update = roomUpdateWithPlayers(host, 1);
    await leaveRoom(guest);

    const snapshot = await update;
    expect(snapshot.players).toHaveLength(1);
    expect(snapshot.players[0].name).toEqual("Host");
  });

  it("promotes a new host when the host disconnects", async () => {
    const host = await connect();
    const guest = await connect();

    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");
    await joinRoom(guest, { code: created.room.code, name: "Guest" });

    const update = roomUpdateWithPlayers(guest, 1);
    host.disconnect();

    const snapshot = await update;
    expect(snapshot.players).toHaveLength(1);
    expect(snapshot.players[0].name).toEqual("Guest");
    expect(snapshot.players[0].isHost).toBe(true);
  });

  it("rejects an unknown room code", async () => {
    const guest = await connect();
    const result = await joinRoom(guest, { code: "ZZZZ", name: "Guest" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual("room_not_found");
  });

  it("rejects a blank name", async () => {
    const guest = await connect();
    const result = await createRoom(guest, { name: "" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual("invalid_name");
  });

  it("sanitises config sent by a client", async () => {
    const host = await connect();
    const created = await createRoom(host, {
      name: "Host",
      config: { minMatch: 999, lives: 0 } as never,
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.room.config.minMatch).toEqual(5);
    expect(created.room.config.lives).toEqual(1);
  });

  it("drops the room once everyone disconnects", async () => {
    const host = await connect();
    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");

    expect(built.registry.roomCount).toEqual(1);

    host.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(built.registry.roomCount).toEqual(0);
  });
});

describe("progress broadcasting", () => {
  it("shares one player's progress with the rest of the room", async () => {
    const host = await connect();
    const guest = await connect();

    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");
    await joinRoom(guest, { code: created.room.code, name: "Guest" });

    const update = roomUpdateWhere(guest, (snapshot) =>
      snapshot.players.some((player) => player.progress?.score === 250)
    );

    host.emit("room:progress", {
      score: 250,
      lives: 11,
      level: 3,
      cleared: 20,
      missed: 9,
      finished: false,
    });

    const snapshot = await update;
    const reporter = snapshot.players.find((player) => player.name === "Host");
    expect(reporter?.progress?.score).toEqual(250);
    expect(reporter?.progress?.lives).toEqual(11);
  });

  it("clamps a forged score before other players see it", async () => {
    const host = await connect();
    const guest = await connect();

    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");
    await joinRoom(guest, { code: created.room.code, name: "Guest" });

    const update = roomUpdateWhere(guest, (snapshot) =>
      snapshot.players.some((player) => player.progress !== null)
    );

    host.emit("room:progress", { score: 1e12 } as never);

    const snapshot = await update;
    const reporter = snapshot.players.find((player) => player.name === "Host");
    expect(reporter?.progress?.score).toEqual(9_999_999);
  });

  it("ignores progress from a player in no room", async () => {
    const loner = await connect();

    loner.emit("room:progress", {
      score: 10,
      lives: 10,
      level: 1,
      cleared: 0,
      missed: 0,
      finished: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(built.registry.roomCount).toEqual(0);
  });
});

describe("attacks", () => {
  function nextAttack(socket: ClientSocket): Promise<{ from: string; count: number }> {
    return new Promise((resolve) => {
      socket.once("room:attacked", resolve);
    });
  }

  it("relays an attack to the rest of the room", async () => {
    const host = await connect();
    const guest = await connect();

    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");
    await joinRoom(guest, { code: created.room.code, name: "Guest" });

    const hit = nextAttack(guest);
    host.emit("room:attack", { count: 3 });

    expect(await hit).toEqual({ from: "Host", count: 3 });
  });

  it("does not send the attack back to the attacker", async () => {
    const host = await connect();
    const guest = await connect();

    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");
    await joinRoom(guest, { code: created.room.code, name: "Guest" });

    let selfHit = false;
    host.on("room:attacked", () => {
      selfHit = true;
    });

    const hit = nextAttack(guest);
    host.emit("room:attack", { count: 2 });
    await hit;

    expect(selfHit).toBe(false);
  });

  it("clamps an oversized attack", async () => {
    const host = await connect();
    const guest = await connect();

    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");
    await joinRoom(guest, { code: created.room.code, name: "Guest" });

    const hit = nextAttack(guest);
    host.emit("room:attack", { count: 9999 } as never);

    expect((await hit).count).toEqual(5);
  });

  it("ignores an attack from someone in no room", async () => {
    const host = await connect();
    const loner = await connect();

    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");

    let hit = false;
    host.on("room:attacked", () => {
      hit = true;
    });

    loner.emit("room:attack", { count: 3 });
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(hit).toBe(false);
  });

  it("ignores a zero or negative attack", async () => {
    const host = await connect();
    const guest = await connect();

    const created = await createRoom(host, { name: "Host" });
    if (!created.ok) throw new Error("setup failed");
    await joinRoom(guest, { code: created.room.code, name: "Guest" });

    let hit = false;
    guest.on("room:attacked", () => {
      hit = true;
    });

    host.emit("room:attack", { count: 0 });
    host.emit("room:attack", { count: -5 } as never);
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(hit).toBe(false);
  });
});
