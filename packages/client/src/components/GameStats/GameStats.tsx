import React from "react";
import type { GameState } from "@letter-game/engine";
import GameStatsField from "@/components/GameStats/GameStatsField";

interface GameStatsProps {
  state: GameState;
  children?: React.ReactNode;
}

function worstKeys(missesByChar: Record<string, number>): string {
  const entries = Object.keys(missesByChar).map((char) => ({
    char,
    misses: missesByChar[char],
  }));

  if (entries.length === 0) {
    return "—";
  }

  return entries
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 3)
    .map((entry) => `${entry.char.toUpperCase()}×${entry.misses}`)
    .join("  ");
}

const GameStats: React.FC<GameStatsProps> = ({ state, children }) => {
  const attempts = state.cleared + state.missed;
  const accuracy =
    attempts === 0 ? 0 : Math.round((state.cleared / attempts) * 100);

  return (
    <>
      <GameStatsField title="Match" value={`${state.config.minMatch}+`} />
      <GameStatsField title="Cleared" value={state.cleared} />
      <GameStatsField title="Accuracy" value={`${accuracy}%`} />
      <GameStatsField title="Missed" value={state.missed} />
      <GameStatsField title="Misfires" value={state.misfires} />
      <GameStatsField title="Best combo" value={state.bestCombo} />
      <GameStatsField title="Weakest" value={worstKeys(state.missesByChar)} />
      <GameStatsField title="Junk taken" value={state.junkReceived} />
      <GameStatsField title="Junk sent" value={state.junkSent} />

      {children}
    </>
  );
};

export default GameStats;
