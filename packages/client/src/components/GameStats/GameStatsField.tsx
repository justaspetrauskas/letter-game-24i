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
    <div className="flex w-full flex-row items-center justify-between rounded-md border border-slate-700 px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {title}
      </h2>
      <span
        className={`text-2xl font-bold tabular-nums ${
          accent ? "text-emerald-400" : "text-slate-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
};

export default GameStatsField;
