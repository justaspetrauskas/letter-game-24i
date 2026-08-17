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

const roundDescriptions: Record<string, string> = {
  homeRow:
    "The nine keys under your fingers, two copies to clear. The standard round.",
  vowels:
    "Five letters only, so copies stack up quickly and clears come thick.",
  fullAlphabet:
    "All twenty-six. Pairs are rare and scattered — you hunt for them rather than react.",
  triples:
    "Three copies on screen before a letter clears, so letters arrive faster to keep a third one coming.",
  sprint: "Ten lives and everything quicker. Short, and it means it.",
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

        {themedName !== null ? (
          <span className="flex flex-row items-center gap-2 rounded-sm border-2 border-panel-outline bg-action px-3 py-2 font-display text-sm font-bold uppercase tracking-wide text-action-ink">
            <span className="rounded-[0.125rem] bg-action-ink/20 px-1 text-[0.625rem] tracking-widest">
              AI
            </span>
            {themedName}
          </span>
        ) : null}
      </div>

      {themedName !== null ? (
        <p className="text-xs leading-relaxed text-ink-dim">
          Playing a generated round. Pick a preset above to go back to a
          standard one.
        </p>
      ) : activeKey !== null && roundDescriptions[activeKey] !== undefined ? (
        <p className="text-xs leading-relaxed text-ink-dim">
          {roundDescriptions[activeKey]}
        </p>
      ) : null}
    </div>
  );
};

export default StartScreenRounds;
