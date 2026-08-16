import React from "react";
import type { GameConfig, GameState } from "@letter-game/engine";
import GameStatsField from "@/components/GameStats/GameStatsField";
import GameStatsRounds from "@/components/GameStats/GameStatsRounds";
import type { RestartOptions } from "@/hooks/useGame";

interface GameStatsProps {
  state: GameState;
  onTogglePause: () => void;
  onRestart: (options?: RestartOptions) => void;
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

const GameStats: React.FC<GameStatsProps> = ({
  state,
  onTogglePause,
  onRestart,
  children,
}) => {
  const attempts = state.cleared + state.missed;
  const accuracy =
    attempts === 0 ? 0 : Math.round((state.cleared / attempts) * 100);

  const handleRestartClick = () => {
    onRestart();
  };

  const handleSelectRound = (config: Partial<GameConfig>) => {
    onRestart({ config });
  };

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-slate-700 bg-slate-950 px-4 py-5">
      <GameStatsField title="Score" value={state.score} accent />
      <GameStatsField
        title="Combo"
        value={state.combo > 0 ? `${state.combo}×` : "—"}
      />
      <GameStatsField title="Lives" value={state.lives} />
      <GameStatsField title="Level" value={state.level} />
      <GameStatsField title="Cleared" value={state.cleared} />
      <GameStatsField title="Accuracy" value={`${accuracy}%`} />
      <GameStatsField title="Misfires" value={state.misfires} />
      <GameStatsField title="Weakest" value={worstKeys(state.missesByChar)} />

      <div className="flex flex-row gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 font-bold text-slate-950 transition-colors duration-150 hover:bg-emerald-400 disabled:opacity-40"
          onClick={onTogglePause}
          disabled={state.status === "finished"}
        >
          {state.status === "paused" ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-slate-700 px-4 py-3 font-bold text-slate-200 transition-colors duration-150 hover:bg-slate-800"
          onClick={handleRestartClick}
        >
          Restart
        </button>
      </div>

      <GameStatsRounds
        activePool={state.config.letterPool}
        onSelectRound={handleSelectRound}
      />

      {children}

      <p className="mt-auto text-xs leading-relaxed text-slate-500">
        Clear a letter by pressing its key while {state.config.minMatch} or more
        of them are falling. Outlined tiles are ready to clear.
      </p>
    </aside>
  );
};

export default GameStats;
