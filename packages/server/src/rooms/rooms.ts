import { randomSeed } from "@letter-game/engine";
import type { GameConfig } from "@letter-game/engine";
import {
  MAX_PLAYERS_PER_ROOM,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  isValidPlayerName,
  isValidRoomCode,
  normaliseRoomCode,
  sanitiseGameConfig,
  sanitisePlayerName,
  sanitiseProgress,
} from "@letter-game/protocol";
import type {
  PlayerProgress,
  RoomErrorCode,
  RoomResult,
  RoomSnapshot,
} from "@letter-game/protocol";

const MAX_CODE_ATTEMPTS = 1000;

interface RoomMember {
  id: string;
  name: string;
  joinedAtMs: number;
  progress: PlayerProgress | null;
}

interface RoomRecord {
  code: string;
  seed: number;
  config: Partial<GameConfig>;
  createdAtMs: number;
  hostId: string;
  members: Map<string, RoomMember>;
}

export interface RoomRegistryOptions {
  now?: () => number;
  makeSeed?: () => number;
  makeCode?: () => string;
  maxPlayers?: number;
}

function defaultMakeCode(): string {
  let code = "";
  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    const position = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET.charAt(position);
  }
  return code;
}

function fail(error: RoomErrorCode, message: string): RoomResult {
  return { ok: false, error, message };
}

function membersByAge(room: RoomRecord): RoomMember[] {
  return Array.from(room.members.values()).sort(
    (left, right) => left.joinedAtMs - right.joinedAtMs
  );
}

function toSnapshot(room: RoomRecord): RoomSnapshot {
  return {
    code: room.code,
    seed: room.seed,
    config: room.config,
    createdAtMs: room.createdAtMs,
    players: membersByAge(room).map((member) => ({
      id: member.id,
      name: member.name,
      isHost: member.id === room.hostId,
      joinedAtMs: member.joinedAtMs,
      progress: member.progress,
    })),
  };
}

export class RoomRegistry {
  private readonly rooms = new Map<string, RoomRecord>();

  private readonly membership = new Map<string, string>();

  private readonly now: () => number;

  private readonly makeSeed: () => number;

  private readonly makeCode: () => string;

  private readonly maxPlayers: number;

  constructor(options: RoomRegistryOptions = {}) {
    this.now = options.now ?? (() => Date.now());
    this.makeSeed = options.makeSeed ?? randomSeed;
    this.makeCode = options.makeCode ?? defaultMakeCode;
    this.maxPlayers = options.maxPlayers ?? MAX_PLAYERS_PER_ROOM;
  }

  get roomCount(): number {
    return this.rooms.size;
  }

  get playerCount(): number {
    return this.membership.size;
  }

  roomOf(playerId: string): string | null {
    return this.membership.get(playerId) ?? null;
  }

  snapshot(code: string): RoomSnapshot | null {
    const room = this.rooms.get(normaliseRoomCode(code));
    return room ? toSnapshot(room) : null;
  }

  create(playerId: string, name: string, config?: unknown): RoomResult {
    if (!isValidPlayerName(name)) {
      return fail("invalid_name", "A player name is required.");
    }

    this.leave(playerId);

    const code = this.allocateCode();
    const createdAtMs = this.now();
    const room: RoomRecord = {
      code,
      seed: this.makeSeed(),
      config: sanitiseGameConfig(config),
      createdAtMs,
      hostId: playerId,
      members: new Map(),
    };

    room.members.set(playerId, {
      id: playerId,
      name: sanitisePlayerName(name),
      joinedAtMs: createdAtMs,
      progress: null,
    });

    this.rooms.set(code, room);
    this.membership.set(playerId, code);

    return { ok: true, room: toSnapshot(room), playerId };
  }

  join(playerId: string, rawCode: string, name: string): RoomResult {
    if (!isValidPlayerName(name)) {
      return fail("invalid_name", "A player name is required.");
    }
    if (!isValidRoomCode(rawCode)) {
      return fail("invalid_code", "That room code is not valid.");
    }

    const code = normaliseRoomCode(rawCode);
    const room = this.rooms.get(code);

    if (!room) {
      return fail("room_not_found", `No room with code ${code}.`);
    }
    if (room.members.has(playerId)) {
      return { ok: true, room: toSnapshot(room), playerId };
    }
    if (room.members.size >= this.maxPlayers) {
      return fail("room_full", `Room ${code} is full.`);
    }

    this.leave(playerId);

    room.members.set(playerId, {
      id: playerId,
      name: sanitisePlayerName(name),
      joinedAtMs: this.now(),
      progress: null,
    });
    this.membership.set(playerId, code);

    return { ok: true, room: toSnapshot(room), playerId };
  }

  updateProgress(playerId: string, progress: unknown): string | null {
    const code = this.membership.get(playerId);
    if (!code) {
      return null;
    }

    const room = this.rooms.get(code);
    const member = room?.members.get(playerId);
    if (!room || !member) {
      return null;
    }

    member.progress = sanitiseProgress(progress);
    return code;
  }

  leave(playerId: string): string | null {
    const code = this.membership.get(playerId);
    if (!code) {
      return null;
    }

    this.membership.delete(playerId);

    const room = this.rooms.get(code);
    if (!room) {
      return code;
    }

    room.members.delete(playerId);

    if (room.members.size === 0) {
      this.rooms.delete(code);
      return code;
    }

    if (room.hostId === playerId) {
      room.hostId = membersByAge(room)[0].id;
    }

    return code;
  }

  private allocateCode(): string {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = normaliseRoomCode(this.makeCode());
      if (!this.rooms.has(code)) {
        return code;
      }
    }
    throw new Error("Unable to allocate an unused room code.");
  }
}
