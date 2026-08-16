import React from "react";
import { Group, Rect, Text } from "react-konva";
import type { LetterState } from "@letter-game/engine";

interface GameLetterProps {
  letter: LetterState;
  stageWidth: number;
  stageHeight: number;
  timeMs: number;
  lingerMs: number;
  clearable: boolean;
}

const POP_IN_MS = 220;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const GameLetter: React.FC<GameLetterProps> = ({
  letter,
  stageWidth,
  stageHeight,
  timeMs,
  lingerMs,
  clearable,
}) => {
  const sizePx = letter.size * stageHeight;
  const leftPx = clamp(
    letter.centerX * stageWidth - sizePx / 2,
    0,
    Math.max(0, stageWidth - sizePx)
  );
  const topPx = letter.bottomY * stageHeight - sizePx;

  const popProgress = clamp((timeMs - letter.spawnedAtMs) / POP_IN_MS, 0, 1);
  const scale = 0.62 + 0.38 * popProgress;

  const settledFor =
    letter.landedAtMs === null ? 0 : timeMs - letter.landedAtMs;
  const fade =
    letter.status === "landed" ? clamp(1 - settledFor / lingerMs, 0, 1) : 1;

  const isLanded = letter.status === "landed";
  const isJunk = letter.kind === "junk";
  const hue = isJunk ? 350 : letter.hue;
  const fill = `hsl(${hue}, ${isLanded ? 12 : isJunk ? 74 : 68}%, ${
    isLanded ? 32 : isJunk ? 46 : 56
  }%)`;
  const outline = clearable && !isLanded;

  return (
    <Group
      x={leftPx + sizePx / 2}
      y={topPx + sizePx / 2}
      offsetX={sizePx / 2}
      offsetY={sizePx / 2}
      scaleX={scale}
      scaleY={scale}
      opacity={fade * (0.35 + 0.65 * popProgress)}
      listening={false}
    >
      <Rect
        width={sizePx}
        height={sizePx}
        cornerRadius={sizePx / 6}
        fill={fill}
        stroke={outline ? "#f8fafc" : "#fda4af"}
        strokeWidth={
          outline || (isJunk && !isLanded) ? Math.max(2, sizePx * 0.045) : 0
        }
        dash={isJunk && !outline ? [sizePx * 0.12, sizePx * 0.08] : undefined}
        shadowColor="#0f172a"
        shadowBlur={sizePx * 0.18}
        shadowOpacity={0.45}
        shadowOffsetY={sizePx * 0.04}
      />
      <Text
        width={sizePx}
        height={sizePx}
        text={letter.char.toUpperCase()}
        fontSize={sizePx / 2}
        fontStyle="bold"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#f8fafc"
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

export default GameLetter;
