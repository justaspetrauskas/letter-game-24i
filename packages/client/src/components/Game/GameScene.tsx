import React from "react";
import { Ellipse, Group, Line, Rect } from "react-konva";
import type { ThemeTokens } from "@/hooks/useThemeTokens";
import { cloudDrift } from "@/components/Game/GameMotion";

interface GameSceneProps {
  width: number;
  height: number;
  timeMs: number;
  dangerRatio: number;
  tokens: ThemeTokens;
}

interface CloudSpec {
  x: number;
  y: number;
  width: number;
  speed: number;
  far: boolean;
}

interface Puff {
  dx: number;
  dy: number;
  rx: number;
  ry: number;
}

const BODY_PUFFS: Puff[] = [
  { dx: 0, dy: 0.17, rx: 0.74, ry: 0.19 },
  { dx: -0.6, dy: 0.08, rx: 0.34, ry: 0.24 },
  { dx: -0.24, dy: -0.02, rx: 0.46, ry: 0.34 },
  { dx: 0.14, dy: -0.07, rx: 0.42, ry: 0.31 },
  { dx: 0.52, dy: 0.06, rx: 0.32, ry: 0.24 },
];

const RIM_OFFSET = 0.055;

const OVERSCAN = 48;

const CLOUDS: CloudSpec[] = [
  { x: 0.06, y: 0.08, width: 0.11, speed: 0.008, far: true },
  { x: 0.34, y: 0.14, width: 0.09, speed: 0.006, far: true },
  { x: 0.61, y: 0.06, width: 0.12, speed: 0.009, far: true },
  { x: 0.88, y: 0.17, width: 0.1, speed: 0.007, far: true },
  { x: 0.2, y: 0.3, width: 0.17, speed: 0.019, far: false },
  { x: 0.72, y: 0.38, width: 0.15, speed: 0.023, far: false },
  { x: 1.08, y: 0.25, width: 0.18, speed: 0.017, far: false },
];

const GameScene: React.FC<GameSceneProps> = ({
  width,
  height,
  timeMs,
  dangerRatio,
  tokens,
}) => {
  const dangerY = height * dangerRatio;

  return (
    <Group listening={false}>
      <Rect
        x={-OVERSCAN}
        y={-OVERSCAN}
        width={width + OVERSCAN * 2}
        height={height + OVERSCAN * 2}
        fillLinearGradientStartPoint={{ x: 0, y: -OVERSCAN }}
        fillLinearGradientEndPoint={{ x: 0, y: height + OVERSCAN }}
        fillLinearGradientColorStops={[
          0,
          tokens.skyTop,
          0.42,
          tokens.skyHigh,
          0.68,
          tokens.skyMid,
          0.88,
          tokens.skyLow,
          0.965,
          tokens.skyHorizon,
          1,
          tokens.skyGlow,
        ]}
      />

      {CLOUDS.map((cloud, index) => {
        const cloudWidth = cloud.width * width;
        const x = cloudDrift(cloud.x, cloud.speed, timeMs) * width;
        const fill = cloud.far ? tokens.cloudShade : tokens.cloud;
        const lit = cloud.far ? tokens.cloud : tokens.cloudLit;

        return (
          <Group key={index} x={x} y={cloud.y * height}>
            {BODY_PUFFS.map((puff, puffIndex) => (
              <Ellipse
                key={`rim-${puffIndex}`}
                x={puff.dx * cloudWidth}
                y={puff.dy * cloudWidth}
                radiusX={puff.rx * cloudWidth}
                radiusY={puff.ry * cloudWidth}
                fill={lit}
              />
            ))}
            {BODY_PUFFS.map((puff, puffIndex) => (
              <Ellipse
                key={`body-${puffIndex}`}
                x={puff.dx * cloudWidth}
                y={(puff.dy + RIM_OFFSET) * cloudWidth}
                radiusX={puff.rx * cloudWidth}
                radiusY={puff.ry * cloudWidth}
                fill={fill}
              />
            ))}
          </Group>
        );
      })}

      <Line
        points={[0, dangerY, width, dangerY]}
        stroke={tokens.danger}
        strokeWidth={2}
        dash={[10, 12]}
        opacity={0.7}
      />
    </Group>
  );
};

export default GameScene;
