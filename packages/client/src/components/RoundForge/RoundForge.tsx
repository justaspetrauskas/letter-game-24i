import React, { useState } from "react";
import { MAX_THEME_LENGTH } from "@letter-game/protocol";
import type { ThemedRound } from "@letter-game/protocol";
import type { RoundStatus } from "@/hooks/useThemedRound";

interface RoundForgeProps {
  status: RoundStatus;
  round: ThemedRound | null;
  error: string | null;
  onGenerate: (theme: string) => void;
}

const RoundForge: React.FC<RoundForgeProps> = ({
  status,
  round,
  error,
  onGenerate,
}) => {
  const [theme, setTheme] = useState("");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onGenerate(theme);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        className="lg-field"
        placeholder="deep ocean, volcano, library..."
        aria-label="Round theme"
        value={theme}
        maxLength={MAX_THEME_LENGTH}
        disabled={status === "loading"}
        onChange={(event) => setTheme(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="lg-btn-panel"
        disabled={status === "loading"}
        onClick={() => onGenerate(theme)}
      >
        {status === "loading" ? "Generating..." : "Generate round"}
      </button>

      {round !== null ? (
        <div className="mt-1 rounded-sm bg-panel-sunk px-3 py-2">
          <p className="font-display text-sm font-bold text-action">
            {round.name}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-dim">
            {round.description}
          </p>
          <p className="mt-2 font-tile text-xs uppercase tracking-widest text-ink-faint">
            {round.config.letterPool}
          </p>
        </div>
      ) : null}

      {error !== null ? (
        <p className="text-xs leading-relaxed text-danger">{error}</p>
      ) : null}
    </div>
  );
};

export default RoundForge;
