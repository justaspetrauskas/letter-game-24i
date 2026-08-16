import React from "react";
import { Circle, Group, Line, Rect, Text } from "react-konva";
import type { LetterState } from "@letter-game/engine";
import type { ThemeTokens } from "@/hooks/useThemeTokens";
import {
  clamp,
  fuseFlicker,
  junkBlink,
  landedFade,
  popProgress,
  tileRotation,
  tileSway,
} from "@/components/Game/GameMotion";

interface GameLetterProps {
  letter: LetterState;
  stageWidth: number;
  stageHeight: number;
  timeMs: number;
  lingerMs: number;
  clearable: boolean;
  tokens: ThemeTokens;
}

const GameLetter: React.FC<GameLetterProps> = ({
  letter,
  stageWidth,
  stageHeight,
  timeMs,
  lingerMs,
  clearable,
  tokens,
}) => {
  const sizePx = letter.size * stageHeight;
  const isLanded = letter.status === "landed";
  const isJunk = letter.kind === "junk";
  const lit = clearable && !isLanded;

  const sway = isLanded ? 0 : tileSway(letter.hue, timeMs) * sizePx;
  const leftPx = clamp(
    letter.centerX * stageWidth - sizePx / 2 + sway,
    0,
    Math.max(0, stageWidth - sizePx)
  );
  const topPx = letter.bottomY * stageHeight - sizePx;

  const pop = popProgress(timeMs, letter.spawnedAtMs);
  const scale = 0.62 + 0.38 * pop;
  const fade = isLanded ? landedFade(timeMs, letter.landedAtMs, lingerMs) : 1;

  const body = isLanded ? tokens.crateShade : isJunk ? tokens.dyn : tokens.crate;
  const plank = isLanded
    ? tokens.crateOutline
    : isJunk
      ? tokens.dynPlank
      : tokens.cratePlank;
  const bevel = isJunk ? tokens.dynLit : tokens.crateLit;
  const outline = isJunk ? tokens.dynOutline : tokens.crateOutline;

  const inset = sizePx * 0.09;
  const plankWidth = sizePx * 0.14;
  const innerHeight = sizePx - inset * 2;

  return (
    <Group
      x={leftPx + sizePx / 2}
      y={topPx + sizePx / 2}
      offsetX={sizePx / 2}
      offsetY={sizePx / 2}
      scaleX={scale}
      scaleY={scale}
      rotation={isLanded ? 0 : tileRotation(letter.hue)}
      opacity={fade * (0.35 + 0.65 * pop)}
      listening={false}
    >
      {lit ? (
        <>
          <Line
            points={[
              sizePx * 0.5,
              0,
              sizePx * 0.5,
              -sizePx * 0.14,
              sizePx * 0.62,
              -sizePx * 0.26,
              sizePx * 0.74,
              -sizePx * 0.36,
            ]}
            stroke={tokens.fuse}
            strokeWidth={Math.max(3, sizePx * 0.075)}
            lineCap="round"
            tension={0.5}
          />
          <Circle
            x={sizePx * 0.76}
            y={-sizePx * 0.4}
            radius={sizePx * 0.22 * fuseFlicker(letter.hue, timeMs)}
            fill={tokens.fuseGlow}
            opacity={0.35}
          />
          <Circle
            x={sizePx * 0.76}
            y={-sizePx * 0.4}
            radius={sizePx * 0.105 * fuseFlicker(letter.hue, timeMs)}
            fill={tokens.fuseSpark}
          />
        </>
      ) : null}

      <Rect
        width={sizePx}
        height={sizePx}
        cornerRadius={sizePx / 8}
        fill={body}
        stroke={lit ? tokens.fuseSpark : outline}
        strokeWidth={Math.max(2, sizePx * (lit ? 0.07 : 0.055))}
        dash={isJunk && !lit ? [sizePx * 0.14, sizePx * 0.09] : undefined}
        shadowColor={tokens.crateOutline}
        shadowBlur={sizePx * 0.16}
        shadowOpacity={0.5}
        shadowOffsetY={sizePx * 0.05}
      />

      <Rect
        x={inset}
        y={inset}
        width={plankWidth}
        height={innerHeight}
        cornerRadius={sizePx * 0.02}
        fill={plank}
        opacity={0.85}
      />
      <Rect
        x={sizePx - inset - plankWidth}
        y={inset}
        width={plankWidth}
        height={innerHeight}
        cornerRadius={sizePx * 0.02}
        fill={plank}
        opacity={0.85}
      />
      <Rect
        x={inset}
        y={inset}
        width={sizePx - inset * 2}
        height={sizePx * 0.08}
        cornerRadius={sizePx * 0.02}
        fill={bevel}
        opacity={isLanded ? 0.15 : 0.5}
      />

      {isJunk && !isLanded ? (
        <Circle
          x={sizePx * 0.5}
          y={sizePx * 0.18}
          radius={sizePx * 0.06}
          fill={tokens.dynLight}
          opacity={junkBlink(timeMs)}
        />
      ) : null}

      <Text
        width={sizePx}
        height={sizePx}
        text={letter.char.toUpperCase()}
        fontSize={sizePx / 2}
        fontStyle="bold"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill={isLanded ? tokens.ink : tokens.crateFace}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

export default GameLetter;
