import React, { useMemo, useRef } from "react";
import { Layer, Stage } from "react-konva";
import type { GameState } from "@letter-game/engine";
import { useStageSize } from "@/hooks/useStageSize";
import { useThemeTokens } from "@/hooks/useThemeTokens";
import type { Burst, Shake } from "@/hooks/useBursts";
import { SHAKE_MS } from "@/hooks/useBursts";
import GameBurst from "@/components/Game/GameBurst";
import GameLetter from "@/components/Game/GameLetter";
import GameOverlay from "@/components/Game/GameOverlay";
import GameScene from "@/components/Game/GameScene";
import { shakeOffset } from "@/components/Game/GameMotion";

interface GameProps {
  state: GameState;
  bursts: Burst[];
  shakes: Shake[];
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

const DANGER_LINE_RATIO = 0.86;

const SHAKE_UNIT = 0.0042;

const Game: React.FC<GameProps> = ({
  state,
  bursts,
  shakes,
  onResume,
  onRestart,
  onExit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useStageSize(containerRef);
  const tokens = useThemeTokens();

  const clearableChars = useMemo(() => {
    const counts: Record<string, number> = {};
    state.letters.forEach((letter) => {
      if (letter.status === "falling") {
        counts[letter.char] = (counts[letter.char] ?? 0) + 1;
      }
    });
    return new Set(
      Object.keys(counts).filter(
        (char) => counts[char] >= state.config.minMatch
      )
    );
  }, [state.letters, state.config.minMatch]);

  const shake = useMemo(() => {
    let x = 0;
    let y = 0;
    shakes.forEach((entry) => {
      const elapsed = state.timeMs - entry.atMs;
      if (elapsed < 0 || elapsed > SHAKE_MS) {
        return;
      }
      const offset = shakeOffset(elapsed, entry.magnitude * SHAKE_UNIT * height);
      x += offset.x;
      y += offset.y;
    });
    return { x, y };
  }, [shakes, state.timeMs, height]);

  const hasStage = width > 0 && height > 0;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-sky-top"
    >
      {hasStage && (
        <Stage width={width} height={height}>
          <Layer listening={false} x={shake.x} y={shake.y}>
            <GameScene
              width={width}
              height={height}
              timeMs={state.timeMs}
              dangerRatio={DANGER_LINE_RATIO}
              tokens={tokens}
            />
          </Layer>

          <Layer listening={false} x={shake.x} y={shake.y}>
            {state.letters.map((letter) => (
              <GameLetter
                key={letter.id}
                letter={letter}
                stageWidth={width}
                stageHeight={height}
                timeMs={state.timeMs}
                lingerMs={state.config.landedLingerMs}
                clearable={clearableChars.has(letter.char)}
                tokens={tokens}
              />
            ))}

            {bursts.map((burst) => (
              <GameBurst
                key={burst.id}
                burst={burst}
                stageWidth={width}
                stageHeight={height}
                timeMs={state.timeMs}
                tokens={tokens}
              />
            ))}
          </Layer>
        </Stage>
      )}

      <GameOverlay
        state={state}
        onResume={onResume}
        onRestart={onRestart}
        onExit={onExit}
      />
    </div>
  );
};

export default Game;
