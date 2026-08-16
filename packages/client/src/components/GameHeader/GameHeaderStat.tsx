import React from "react";

interface GameHeaderStatProps {
  label: string;
  value: number | string;
  accent?: boolean;
}

const GameHeaderStat: React.FC<GameHeaderStatProps> = ({
  label,
  value,
  accent = false,
}) => {
  return (
    <div className="flex flex-col items-start justify-center px-2 sm:px-3">
      <span className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-ink-faint">
        {label}
      </span>
      <span
        className={`font-display text-2xl font-bold leading-tight tabular-nums ${
          accent ? "text-action" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
};

export default GameHeaderStat;
