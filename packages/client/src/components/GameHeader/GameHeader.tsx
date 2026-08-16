import React from "react";
import type { GameState } from "@letter-game/engine";
import GameHeaderStat from "@/components/GameHeader/GameHeaderStat";
import GameHeaderLives from "@/components/GameHeader/GameHeaderLives";

interface GameHeaderProps {
  state: GameState;
  drawerOpen: boolean;
  rivalAvailable: boolean;
  rivalMuted: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleDrawer: () => void;
  onToggleMute: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  state,
  drawerOpen,
  rivalAvailable,
  rivalMuted,
  onTogglePause,
  onRestart,
  onToggleDrawer,
  onToggleMute,
}) => {
  return (
    <header className="z-20 flex shrink-0 flex-row items-stretch gap-0.5 border-b-4 border-panel-outline bg-panel px-2 py-2 sm:gap-1 sm:px-3">
      <GameHeaderStat label="Score" value={state.score} accent />
      <GameHeaderLives lives={state.lives} maxLives={state.config.lives} />
      <GameHeaderStat label="Level" value={state.level} />
      <GameHeaderStat
        label="Combo"
        value={state.combo > 0 ? `${state.combo}×` : "—"}
      />

      <div className="hidden flex-row items-center px-3 lg:flex">
        <span className="rounded-sm border-2 border-panel-edge bg-panel-sunk px-2 py-1 font-display text-xs font-bold uppercase tracking-widest text-ink-dim">
          Match {state.config.minMatch}+
        </span>
      </div>

      <div className="ml-auto flex shrink-0 flex-row items-center gap-1 sm:gap-2">
        {rivalAvailable ? (
          <button
            type="button"
            className="lg-btn-panel"
            onClick={onToggleMute}
            aria-pressed={rivalMuted}
          >
            {rivalMuted ? "Rival off" : "Rival on"}
          </button>
        ) : null}
        <button
          type="button"
          className="lg-btn-panel"
          onClick={onTogglePause}
          disabled={state.status === "finished"}
        >
          {state.status === "paused" ? "Resume" : "Pause"}
        </button>
        <button type="button" className="lg-btn-panel" onClick={onRestart}>
          Restart
        </button>
        <button
          type="button"
          className="lg-btn-panel"
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
