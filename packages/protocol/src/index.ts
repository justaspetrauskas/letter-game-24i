import type { GameConfig } from "@letter-game/engine";
import type { AttackPayload, AttackedPayload, PlayerProgress } from "./progress";

export {
  MAX_LETTER_POOL_LENGTH,
  configBounds,
  rangeBounds,
  sanitiseGameConfig,
  sanitiseLetterPool,
} from "./config";

export type { NumericBound } from "./config";

export {
  MAX_THEME_LENGTH,
  MIN_GENERATED_POOL_SIZE,
  isValidTheme,
  sanitiseTheme,
} from "./rounds";

export type {
  CapabilitiesResponse,
  RoundError,
  RoundErrorCode,
  ThemedRound,
} from "./rounds";

export {
  BIG_CLEAR_THRESHOLD,
  MAX_BUFFERED_EVENTS,
  MAX_RIVAL_LINE_LENGTH,
  MISFIRE_BURST_THRESHOLD,
  MISS_BURST_THRESHOLD,
  RIVAL_HISTORY_SIZE,
  RIVAL_MIN_INTERVAL_MS,
  RIVAL_WINDOW_MS,
  emptySnapshot,
  sanitiseRecentLines,
  sanitiseRivalLine,
  sanitiseRivalSnapshot,
  shouldCommentate,
  summariseEvents,
} from "./rival";

export type { RivalRequest, RivalResponse, RivalSnapshot } from "./rival";

export {
  ATTACKS_PER_WINDOW,
  ATTACK_REFILL_MS,
  MAX_ATTACK_LETTERS,
  PROGRESS_BROADCAST_MS,
  PROGRESS_REPORT_MS,
  emptyProgress,
  sanitiseAttackCount,
  sanitiseProgress,
} from "./progress";

export type {
  AttackPayload,
  AttackedPayload,
  PlayerProgress,
} from "./progress";

export const ROOM_CODE_LENGTH = 4;

export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const MAX_PLAYERS_PER_ROOM = 8;

export const MAX_NAME_LENGTH = 16;

export interface RoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  joinedAtMs: number;
  progress: PlayerProgress | null;
}

export interface RoomSnapshot {
  code: string;
  seed: number;
  config: Partial<GameConfig>;
  players: RoomPlayer[];
  createdAtMs: number;
}

export type RoomErrorCode =
  | "invalid_code"
  | "invalid_name"
  | "room_full"
  | "room_not_found"
  | "not_in_room";

export type RoomResult =
  | { ok: true; room: RoomSnapshot; playerId: string }
  | { ok: false; error: RoomErrorCode; message: string };

export interface CreateRoomPayload {
  name: string;
  config?: Partial<GameConfig>;
}

export interface JoinRoomPayload {
  code: string;
  name: string;
}

export interface ClientToServerEvents {
  "room:create": (
    payload: CreateRoomPayload,
    ack: (result: RoomResult) => void
  ) => void;
  "room:join": (
    payload: JoinRoomPayload,
    ack: (result: RoomResult) => void
  ) => void;
  "room:leave": (ack: (result: { ok: boolean }) => void) => void;
  "room:progress": (progress: PlayerProgress) => void;
  "room:attack": (payload: AttackPayload) => void;
}

export interface ServerToClientEvents {
  "room:update": (room: RoomSnapshot) => void;
  "room:left": (payload: { code: string }) => void;
  "room:attacked": (payload: AttackedPayload) => void;
}

export function normaliseRoomCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidRoomCode(raw: string): boolean {
  const code = normaliseRoomCode(raw);
  if (code.length !== ROOM_CODE_LENGTH) {
    return false;
  }
  return code
    .split("")
    .every((char) => ROOM_CODE_ALPHABET.indexOf(char) !== -1);
}

export function sanitisePlayerName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

export function isValidPlayerName(raw: string): boolean {
  return sanitisePlayerName(raw).length > 0;
}
