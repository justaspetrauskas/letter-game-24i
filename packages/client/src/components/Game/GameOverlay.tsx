import React from "react";
import type { GameState } from "@letter-game/engine";

interface GameOverlayProps {
  state: GameState;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({
  state,
  onResume,
  onRestart,
  onExit,
}) => {
  if (state.status === "playing") {
    return null;
  }

  const isFinished = state.status === "finished";
  const accuracyBase = state.cleared + state.missed;
  const accuracy =
    accuracyBase === 0 ? 0 : Math.round((state.cleared / accuracyBase) * 100);

  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 text-ink ${
        isFinished ? "bg-scrim/85" : "bg-scrim/60 backdrop-blur-md"
      }`}
    >
      <h2 className="font-display text-5xl font-bold uppercase tracking-tight">
        {isFinished ? "Game over" : "Time out"}
      </h2>

      {isFinished && (
        <dl className="flex flex-row gap-8 text-center">
          <div>
            <dt className="text-xs uppercase tracking-widest text-ink-faint">
              Score
            </dt>
            <dd className="font-display text-3xl font-bold">{state.score}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-ink-faint">
              Best combo
            </dt>
            <dd className="font-display text-3xl font-bold">
              {state.bestCombo}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-ink-faint">
              Accuracy
            </dt>
            <dd className="font-display text-3xl font-bold">{accuracy}%</dd>
          </div>
        </dl>
      )}

      <div className="flex flex-row gap-3">
        <button
          type="button"
          className="rounded-md border-2 border-panel-outline bg-action px-6 py-3 font-display text-lg font-bold uppercase tracking-wider text-action-ink shadow-chunk-action transition-colors duration-150 hover:bg-action-lit"
          onClick={isFinished ? onRestart : onResume}
        >
          {isFinished ? "Play again" : "Resume"}
        </button>
        <button
          type="button"
          className="rounded-md border-2 border-panel-outline bg-panel-raised px-6 py-3 font-display text-lg font-bold uppercase tracking-wider text-ink shadow-chunk transition-colors duration-150 hover:bg-panel-edge"
          onClick={onExit}
        >
          Change setup
        </button>
      </div>

      <p className="text-sm text-ink-faint">
        {isFinished
          ? "Play again keeps your setup and rolls a fresh seed"
          : "Press space or escape to resume"}
      </p>
    </div>
  );
};

export default GameOverlay;
