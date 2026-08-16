import React from "react";

interface GameStatsFieldProps {
  title: string;
  value: number | string;
  accent?: boolean;
}

const GameStatsField: React.FC<GameStatsFieldProps> = ({
  title,
  value,
  accent = false,
}) => {
  return (
    <div className="lg-inset flex w-full flex-row items-center justify-between px-3 py-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-ink-faint">
        {title}
      </h3>
      <span
        className={`font-display text-xl font-bold tabular-nums ${
          accent ? "text-action" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
};

export default GameStatsField;
