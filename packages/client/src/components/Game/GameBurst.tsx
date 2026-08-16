import React from "react";
import { Circle, Group, Rect, Text } from "react-konva";
import type { ThemeTokens } from "@/hooks/useThemeTokens";
import type { Burst } from "@/hooks/useBursts";
import { CLEAR_BURST_MS, DUD_BURST_MS } from "@/hooks/useBursts";
import {
  burstProgress,
  clamp,
  easeOut,
  pseudoRandom,
  shardOffset,
} from "@/components/Game/GameMotion";

interface GameBurstProps {
  burst: Burst;
  stageWidth: number;
  stageHeight: number;
  timeMs: number;
  tokens: ThemeTokens;
}

const FLASH_FRACTION = 0.16;

const SMOKE_PUFFS = [
  { dx: -0.42, dy: -0.18, r: 0.34 },
  { dx: 0.3, dy: -0.3, r: 0.28 },
  { dx: 0.02, dy: -0.52, r: 0.24 },
];

const CALLOUT_THRESHOLD = 4;

const BIG_CALLOUT_THRESHOLD = 6;

const GameBurst: React.FC<GameBurstProps> = ({
  burst,
  stageWidth,
  stageHeight,
  timeMs,
  tokens,
}) => {
  const isClear = burst.kind === "clear";
  const duration = isClear ? CLEAR_BURST_MS : DUD_BURST_MS;
  const t = burstProgress(timeMs, burst.atMs, duration);

  if (t < 0 || t >= 1) {
    return null;
  }

  const eased = easeOut(t);
  const sizePx = burst.size * stageHeight;
  const x = burst.x * stageWidth;
  const y = burst.y * stageHeight;

  const smokeTint = isClear ? tokens.smoke : tokens.cloudShade;

  return (
    <Group x={x} y={y} listening={false}>
      {isClear && t < FLASH_FRACTION ? (
        <Circle
          radius={sizePx * (0.4 + 1.6 * easeOut(t / FLASH_FRACTION))}
          fill={tokens.fireCore}
          opacity={1 - t / FLASH_FRACTION}
        />
      ) : null}

      {isClear ? (
        <>
          <Circle
            radius={sizePx * (0.25 + 1.05 * eased)}
            fill={tokens.fire3}
            opacity={clamp(0.85 - t * 1.15, 0, 1)}
          />
          <Circle
            radius={sizePx * (0.16 + 0.68 * eased)}
            fill={tokens.fire1}
            opacity={clamp(0.9 - t * 1.6, 0, 1)}
          />
          <Circle
            radius={sizePx * (0.3 + 2.4 * eased)}
            stroke={tokens.fire2}
            strokeWidth={Math.max(1, sizePx * 0.16 * (1 - t))}
            opacity={clamp(0.7 - t * 0.75, 0, 1)}
          />
        </>
      ) : (
        <Circle
          radius={sizePx * (0.2 + 0.5 * eased)}
          fill={tokens.fire4}
          opacity={clamp(0.5 - t * 0.7, 0, 1)}
        />
      )}

      {SMOKE_PUFFS.map((puff, index) => (
        <Circle
          key={`smoke-${index}`}
          x={puff.dx * sizePx * eased * 1.3}
          y={puff.dy * sizePx * eased * 1.6}
          radius={sizePx * puff.r * (0.4 + eased)}
          fill={smokeTint}
          opacity={clamp(0.42 - t * 0.45, 0, 1)}
        />
      ))}

      {isClear
        ? burst.shards.map((shard, index) => {
            const offset = shardOffset(shard.angle, shard.speed, t);
            const shardSize = sizePx * shard.scale;
            const tone =
              pseudoRandom(burst.id * 13 + index) > 0.5
                ? tokens.crate
                : tokens.cratePlank;
            return (
              <Rect
                key={`shard-${index}`}
                x={offset.dx * sizePx}
                y={offset.dy * sizePx}
                width={shardSize}
                height={shardSize}
                offsetX={shardSize / 2}
                offsetY={shardSize / 2}
                cornerRadius={shardSize * 0.2}
                rotation={shard.spin * t}
                fill={tone}
                stroke={tokens.crateOutline}
                strokeWidth={Math.max(1, shardSize * 0.14)}
                opacity={clamp(1 - t * t * 1.4, 0, 1)}
              />
            );
          })
        : null}

      {isClear && burst.lead && burst.count >= CALLOUT_THRESHOLD ? (
        <Text
          text={burst.count >= BIG_CALLOUT_THRESHOLD ? "KABOOM!" : "BOOM!"}
          fontSize={sizePx * (0.42 + 0.24 * eased)}
          fontStyle="bold"
          fontFamily="Trebuchet MS, Avenir Next, Segoe UI, sans-serif"
          fill={tokens.fuseSpark}
          stroke={tokens.crateOutline}
          strokeWidth={Math.max(1, sizePx * 0.03)}
          align="center"
          width={sizePx * 5}
          offsetX={sizePx * 2.5}
          y={-sizePx * (0.7 + 0.9 * eased)}
          opacity={clamp(1.25 - t * 1.6, 0, 1)}
        />
      ) : null}
    </Group>
  );
};

export default GameBurst;
