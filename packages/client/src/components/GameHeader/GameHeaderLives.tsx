import React from "react";

interface GameHeaderLivesProps {
  lives: number;
  maxLives: number;
}

const WARN_RATIO = 0.5;

const DANGER_RATIO = 0.25;

function barColour(ratio: number): string {
  if (ratio > WARN_RATIO) {
    return "bg-health-good";
  }
  if (ratio > DANGER_RATIO) {
    return "bg-health-warn";
  }
  return "bg-health-bad";
}

const GameHeaderLives: React.FC<GameHeaderLivesProps> = ({
  lives,
  maxLives,
}) => {
  const ratio = maxLives === 0 ? 0 : Math.max(0, Math.min(lives / maxLives, 1));

  return (
    <div className="flex min-w-[6.5rem] flex-col justify-center gap-1 px-2 sm:min-w-[9rem] sm:px-3">
      <div className="flex flex-row items-baseline justify-between gap-2">
        <span className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-ink-faint">
          Lives
        </span>
        <span className="font-display text-sm font-bold tabular-nums text-ink">
          {lives}
        </span>
      </div>

      <div
        className="h-3 w-full overflow-hidden rounded-sm border-2 border-panel-outline bg-panel-sunk"
        role="meter"
        aria-valuenow={lives}
        aria-valuemin={0}
        aria-valuemax={maxLives}
        aria-label="Lives remaining"
      >
        <div
          className={`h-full transition-[width] duration-300 ease-out ${barColour(
            ratio
          )}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
};

export default GameHeaderLives;
