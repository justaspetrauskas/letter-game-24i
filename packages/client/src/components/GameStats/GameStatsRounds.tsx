import React from "react";
import { roundPresets } from "@letter-game/engine";
import type { GameConfig } from "@letter-game/engine";

interface GameStatsRoundsProps {
  activePool: string;
  onSelectRound: (config: Partial<GameConfig>) => void;
}

const roundLabels: Record<string, string> = {
  homeRow: "Home row",
  vowels: "Vowels",
  fullAlphabet: "Alphabet",
  triples: "Triples",
  sprint: "Sprint",
};

const GameStatsRounds: React.FC<GameStatsRoundsProps> = ({
  activePool,
  onSelectRound,
}) => {
  const roundKeys = Object.keys(roundPresets);

  return (
    <div className="w-full rounded-md border border-slate-700 px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Round
      </h2>
      <div className="mt-3 flex flex-row flex-wrap gap-2">
        {roundKeys.map((key) => {
          const preset = roundPresets[key];
          const isActive = preset.letterPool === activePool;
          return (
            <button
              type="button"
              key={key}
              className={`rounded-md px-3 py-2 text-sm font-bold transition-colors duration-150 ${
                isActive
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              onClick={() => onSelectRound(preset)}
            >
              {roundLabels[key] ?? key}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GameStatsRounds;
