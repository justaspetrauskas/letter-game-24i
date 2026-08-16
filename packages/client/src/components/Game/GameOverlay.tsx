import React from "react";
import type { GameState } from "@letter-game/engine";

interface GameOverlayProps {
  state: GameState;
  onResume: () => void;
  onRestart: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({
  state,
  onResume,
  onRestart,
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
      className={`absolute inset-0 flex flex-col items-center justify-center gap-6 text-slate-100 ${
        isFinished ? "bg-slate-950/80" : "bg-slate-950/50 backdrop-blur-md"
      }`}
    >
      <h2 className="text-4xl font-bold tracking-tight">
        {isFinished ? "Game over" : "Paused"}
      </h2>

      {isFinished && (
        <dl className="flex flex-row gap-8 text-center">
          <div>
            <dt className="text-xs uppercase tracking-widest text-slate-400">
              Score
            </dt>
            <dd className="text-3xl font-bold">{state.score}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-slate-400">
              Best combo
            </dt>
            <dd className="text-3xl font-bold">{state.bestCombo}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-slate-400">
              Accuracy
            </dt>
            <dd className="text-3xl font-bold">{accuracy}%</dd>
          </div>
        </dl>
      )}

      <button
        type="button"
        className="rounded-lg bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition-colors duration-150 hover:bg-emerald-400"
        onClick={isFinished ? onRestart : onResume}
      >
        {isFinished ? "Play again" : "Resume"}
      </button>

      <p className="text-sm text-slate-400">
        {isFinished
          ? "Press play again to start a fresh seed"
          : "Press space or escape to resume"}
      </p>
    </div>
  );
};

export default GameOverlay;
