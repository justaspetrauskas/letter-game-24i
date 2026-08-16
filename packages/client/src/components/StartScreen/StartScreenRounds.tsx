import React from "react";
import { roundPresets } from "@letter-game/engine";

interface StartScreenRoundsProps {
  activeKey: string | null;
  themedName: string | null;
  onSelect: (key: string) => void;
}

const roundLabels: Record<string, string> = {
  homeRow: "Home row",
  vowels: "Vowels",
  fullAlphabet: "Alphabet",
  triples: "Triples",
  sprint: "Sprint",
};

const StartScreenRounds: React.FC<StartScreenRoundsProps> = ({
  activeKey,
  themedName,
  onSelect,
}) => {
  const roundKeys = Object.keys(roundPresets);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-faint">
        Round
      </h3>

      <div className="flex flex-row flex-wrap gap-2">
        {roundKeys.map((key) => {
          const isActive = key === activeKey;
          return (
            <button
              type="button"
              key={key}
              aria-pressed={isActive}
              className={`rounded-sm border-2 px-3 py-2 font-display text-sm font-bold uppercase tracking-wide transition-colors duration-150 ${
                isActive
                  ? "border-panel-outline bg-action text-action-ink"
                  : "border-panel-outline bg-panel-raised text-ink-dim hover:bg-panel-edge hover:text-ink"
              }`}
              onClick={() => onSelect(key)}
            >
              {roundLabels[key] ?? key}
            </button>
          );
        })}
      </div>

      {themedName !== null ? (
        <p className="text-xs leading-relaxed text-ink-dim">
          Playing the generated round{" "}
          <span className="font-bold text-action">{themedName}</span>. Pick a
          preset above to go back to a standard round.
        </p>
      ) : null}
    </div>
  );
};

export default StartScreenRounds;
