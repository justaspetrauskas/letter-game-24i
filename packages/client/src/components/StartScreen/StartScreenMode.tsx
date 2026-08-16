import React from "react";
import type { MatchMode } from "@/hooks/useMatchSetup";

interface StartScreenModeProps {
  mode: MatchMode;
  onChange: (mode: MatchMode) => void;
}

const options: Array<{ value: MatchMode; label: string }> = [
  { value: "solo", label: "Solo" },
  { value: "party", label: "With someone" },
];

const StartScreenMode: React.FC<StartScreenModeProps> = ({
  mode,
  onChange,
}) => {
  return (
    <div
      className="flex flex-row gap-1 rounded-md border-2 border-panel-outline bg-panel-sunk p-1"
      role="group"
      aria-label="Match mode"
    >
      {options.map((option) => {
        const isActive = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            className={`flex-1 rounded-sm px-4 py-3 font-display text-sm font-bold uppercase tracking-wider transition-colors duration-150 ${
              isActive
                ? "bg-action text-action-ink shadow-chunk-action"
                : "text-ink-dim hover:bg-panel-raised hover:text-ink"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default StartScreenMode;
