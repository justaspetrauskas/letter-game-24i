import type { GameConfig } from "@letter-game/engine";

export const MAX_THEME_LENGTH = 60;

export const MIN_GENERATED_POOL_SIZE = 3;

export interface ThemedRound {
  id: string;
  theme: string;
  name: string;
  description: string;
  config: Partial<GameConfig>;
}

export type RoundErrorCode =
  | "ai_unavailable"
  | "locked"
  | "invalid_theme"
  | "rate_limited"
  | "generation_failed"
  | "refused";

export interface RoundError {
  error: RoundErrorCode;
  message: string;
}

export interface CapabilitiesResponse {
  ai: boolean;
  locked: boolean;
  unlocked: boolean;
}

export function sanitiseTheme(raw: unknown): string {
  if (typeof raw !== "string") {
    return "";
  }
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_THEME_LENGTH);
}

export function isValidTheme(raw: unknown): boolean {
  return sanitiseTheme(raw).length > 0;
}
