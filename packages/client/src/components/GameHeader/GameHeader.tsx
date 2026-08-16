import React from "react";
import type { GameState } from "@letter-game/engine";
import GameHeaderStat from "@/components/GameHeader/GameHeaderStat";
import GameHeaderLives from "@/components/GameHeader/GameHeaderLives";

interface GameHeaderProps {
  state: GameState;
  drawerOpen: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleDrawer: () => void;
}

const buttonClass =
  "rounded-md border-2 border-panel-outline bg-panel-raised px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-ink shadow-chunk-sm transition-colors duration-150 hover:bg-panel-edge disabled:opacity-40";

const GameHeader: React.FC<GameHeaderProps> = ({
  state,
  drawerOpen,
  onTogglePause,
  onRestart,
  onToggleDrawer,
}) => {
  return (
    <header className="z-20 flex shrink-0 flex-row items-stretch gap-1 border-b-4 border-panel-outline bg-panel px-3 py-2">
      <GameHeaderStat label="Score" value={state.score} accent />
      <GameHeaderLives lives={state.lives} maxLives={state.config.lives} />
      <GameHeaderStat label="Level" value={state.level} />
      <GameHeaderStat
        label="Combo"
        value={state.combo > 0 ? `${state.combo}×` : "—"}
      />

      <div className="flex flex-row items-center px-3">
        <span className="rounded-sm border-2 border-panel-edge bg-panel-sunk px-2 py-1 font-display text-xs font-bold uppercase tracking-widest text-ink-dim">
          Match {state.config.minMatch}+
        </span>
      </div>

      <div className="ml-auto flex flex-row items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={onTogglePause}
          disabled={state.status === "finished"}
        >
          {state.status === "paused" ? "Resume" : "Pause"}
        </button>
        <button type="button" className={buttonClass} onClick={onRestart}>
          Restart
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={onToggleDrawer}
          aria-expanded={drawerOpen}
        >
          {drawerOpen ? "Hide stats" : "Stats"}
        </button>
      </div>
    </header>
  );
};

export default GameHeader;
