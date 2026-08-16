import React, { useState } from "react";
import { MAX_THEME_LENGTH } from "@letter-game/protocol";
import type { ThemedRound } from "@letter-game/protocol";
import type { RoundStatus } from "@/hooks/useThemedRound";

interface RoundForgeProps {
  serverReachable: boolean;
  available: boolean;
  status: RoundStatus;
  round: ThemedRound | null;
  error: string | null;
  onGenerate: (theme: string) => void;
}

const RoundForge: React.FC<RoundForgeProps> = ({
  serverReachable,
  available,
  status,
  round,
  error,
  onGenerate,
}) => {
  const [theme, setTheme] = useState("");

  if (!serverReachable) {
    return null;
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onGenerate(theme);
    }
  };

  return (
    <div className="rounded-md border-2 border-panel-outline bg-panel p-4">
      <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-faint">
        Themed round
      </h3>

      {available ? (
        <div className="mt-3 flex flex-col gap-2">
          <input
            className="rounded-sm border-2 border-panel-outline bg-panel-sunk px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-action focus:outline-none"
            placeholder="deep ocean, volcano, library..."
            value={theme}
            maxLength={MAX_THEME_LENGTH}
            disabled={status === "loading"}
            onChange={(event) => setTheme(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="rounded-sm border-2 border-panel-outline bg-panel-raised px-3 py-2 font-display text-sm font-bold uppercase tracking-wider text-ink transition-colors duration-150 hover:bg-panel-edge disabled:opacity-40"
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
        </div>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          Set ANTHROPIC_API_KEY on the server to generate rounds from a theme.
        </p>
      )}

      {error !== null ? (
        <p className="mt-3 text-xs leading-relaxed text-danger">{error}</p>
      ) : null}
    </div>
  );
};

export default RoundForge;
