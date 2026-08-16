import { useCallback, useMemo, useState } from "react";
import { defaultConfig, resolveConfig, roundPresets } from "@letter-game/engine";
import type { GameConfig } from "@letter-game/engine";
import type { ThemedRound } from "@letter-game/protocol";

export type MatchMode = "solo" | "party";

export const DEFAULT_ROUND_KEY = "homeRow";

export const REFERENCE_HEIGHT = 820;

export const MIN_SPEED_SCALE = 0.62;

export function viewportSpeedScale(height: number): number {
  if (!Number.isFinite(height) || height <= 0) {
    return 1;
  }
  const scale = height / REFERENCE_HEIGHT;
  return Math.min(Math.max(scale, MIN_SPEED_SCALE), 1);
}

export function easeConfigForViewport(
  config: Partial<GameConfig>,
  height: number
): Partial<GameConfig> {
  const scale = viewportSpeedScale(height);
  if (scale === 1) {
    return config;
  }
  const [min, max] = config.fallSpeed ?? defaultConfig.fallSpeed;
  return { ...config, fallSpeed: [min * scale, max * scale] };
}

export interface UseMatchSetupResult {
  mode: MatchMode;
  roundKey: string | null;
  themedName: string | null;
  config: Partial<GameConfig>;
  resolved: GameConfig;
  setMode: (mode: MatchMode) => void;
  selectPreset: (key: string) => void;
  selectThemed: (round: ThemedRound) => void;
}

export function useMatchSetup(): UseMatchSetupResult {
  const [mode, setMode] = useState<MatchMode>("solo");
  const [roundKey, setRoundKey] = useState<string | null>(DEFAULT_ROUND_KEY);
  const [themedName, setThemedName] = useState<string | null>(null);
  const [config, setConfig] = useState<Partial<GameConfig>>(
    () => roundPresets[DEFAULT_ROUND_KEY] ?? {}
  );

  const selectPreset = useCallback((key: string) => {
    const preset = roundPresets[key];
    if (preset === undefined) {
      return;
    }
    setRoundKey(key);
    setThemedName(null);
    setConfig(preset);
  }, []);

  const selectThemed = useCallback((round: ThemedRound) => {
    setRoundKey(null);
    setThemedName(round.name);
    setConfig(round.config);
  }, []);

  const resolved = useMemo(() => resolveConfig(config), [config]);

  return {
    mode,
    roundKey,
    themedName,
    config,
    resolved,
    setMode,
    selectPreset,
    selectThemed,
  };
}
