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

  const handleGenerateClick = () => {
    onGenerate(theme);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onGenerate(theme);
    }
  };

  return (
    <div className="w-full rounded-md border border-slate-700 px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Themed round
      </h2>

      {available ? (
        <div className="mt-3 flex flex-col gap-2">
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
            placeholder="deep ocean, volcano, library..."
            value={theme}
            maxLength={MAX_THEME_LENGTH}
            disabled={status === "loading"}
            onChange={(event) => setTheme(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950 transition-colors duration-150 hover:bg-emerald-400 disabled:opacity-40"
            disabled={status === "loading"}
            onClick={handleGenerateClick}
          >
            {status === "loading" ? "Generating..." : "Generate round"}
          </button>

          {round !== null ? (
            <div className="mt-1 rounded-md bg-slate-900 px-3 py-2">
              <p className="text-sm font-bold text-emerald-400">{round.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {round.description}
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-slate-500">
                {round.config.letterPool}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Set ANTHROPIC_API_KEY on the server to generate rounds from a theme.
        </p>
      )}

      {error !== null ? (
        <p className="mt-3 text-xs leading-relaxed text-rose-400">{error}</p>
      ) : null}
    </div>
  );
};

export default RoundForge;
