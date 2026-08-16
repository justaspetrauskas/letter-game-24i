import React from "react";
import type { GameConfig } from "@letter-game/engine";
import type { MatchMode } from "@/hooks/useMatchSetup";

interface StartScreenRulesProps {
  config: GameConfig;
  mode: MatchMode;
}

const StartScreenRules: React.FC<StartScreenRulesProps> = ({
  config,
  mode,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-faint">
        How to play
      </h3>

      <ol className="flex flex-col gap-2 text-sm leading-relaxed text-ink-dim">
        <li>Letters fall from the sky. Press a letter's key to blow it up.</li>
        <li>
          <span className="font-bold text-ink">
            Only when {config.minMatch} or more copies are on screen at once.
          </span>{" "}
          A lone letter can't be cleared, so watch the board as well as the
          clock.
        </li>
        <li>Tiles that are ready to clear have a lit fuse.</li>
        <li>
          Let one reach the bottom and it costs a life. Lose all{" "}
          {config.lives} and the round is over.
        </li>
        {mode === "party" ? (
          <li>
            Clear {config.attackThreshold} or more at once and you lob junk
            letters at everyone else in the room.
          </li>
        ) : null}
      </ol>

      <p className="text-xs leading-relaxed text-ink-faint">
        Space or escape pauses.
      </p>
    </div>
  );
};

export default StartScreenRules;
