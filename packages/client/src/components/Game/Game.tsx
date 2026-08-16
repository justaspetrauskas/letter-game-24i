import React, { useMemo, useRef } from "react";
import { Layer, Line, Stage } from "react-konva";
import type { GameState } from "@letter-game/engine";
import { useStageSize } from "@/hooks/useStageSize";
import GameLetter from "@/components/Game/GameLetter";
import GameOverlay from "@/components/Game/GameOverlay";

interface GameProps {
  state: GameState;
  onResume: () => void;
  onRestart: () => void;
}

const DANGER_LINE_RATIO = 0.86;

const Game: React.FC<GameProps> = ({ state, onResume, onRestart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useStageSize(containerRef);

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

  const hasStage = width > 0 && height > 0;

  return (
    <div
      ref={containerRef}
      className="relative h-full flex-1 overflow-hidden bg-slate-900"
    >
      {hasStage && (
        <Stage width={width} height={height}>
          <Layer listening={false}>
            <Line
              points={[
                0,
                height * DANGER_LINE_RATIO,
                width,
                height * DANGER_LINE_RATIO,
              ]}
              stroke="#f43f5e"
              strokeWidth={1}
              dash={[8, 10]}
              opacity={0.4}
            />
            {state.letters.map((letter) => (
              <GameLetter
                key={letter.id}
                letter={letter}
                stageWidth={width}
                stageHeight={height}
                timeMs={state.timeMs}
                lingerMs={state.config.landedLingerMs}
                clearable={clearableChars.has(letter.char)}
              />
            ))}
          </Layer>
        </Stage>
      )}

      <GameOverlay state={state} onResume={onResume} onRestart={onRestart} />
    </div>
  );
};

export default Game;
