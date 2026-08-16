export const POP_IN_MS = 220;

const SWAY_PERIOD_MS = 1400;

const SWAY_AMPLITUDE = 0.035;

const ROTATION_SPREAD_DEGREES = 3.5;

const FUSE_FLICKER_PERIOD_MS = 190;

const JUNK_BLINK_PERIOD_MS = 620;

const CLOUD_WRAP = 1.5;

const CLOUD_WRAP_OFFSET = 0.35;

export const SHARD_GRAVITY = 5;

const SHAKE_DECAY_MS = 130;

const SHAKE_FREQ_X = 17;

const SHAKE_FREQ_Y = 23;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function easeOut(t: number): number {
  const inverted = 1 - clamp(t, 0, 1);
  return 1 - inverted * inverted * inverted;
}

export function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function burstProgress(
  timeMs: number,
  atMs: number,
  durationMs: number
): number {
  return (timeMs - atMs) / durationMs;
}

export function shardOffset(
  angle: number,
  speed: number,
  t: number
): { dx: number; dy: number } {
  return {
    dx: Math.cos(angle) * speed * t,
    dy: Math.sin(angle) * speed * t + 0.5 * SHARD_GRAVITY * t * t,
  };
}

export function shakeOffset(
  elapsedMs: number,
  magnitude: number
): { x: number; y: number } {
  if (elapsedMs < 0) {
    return { x: 0, y: 0 };
  }
  const decay = Math.exp(-elapsedMs / SHAKE_DECAY_MS);
  return {
    x: magnitude * decay * Math.sin(elapsedMs / SHAKE_FREQ_X),
    y: magnitude * decay * Math.cos(elapsedMs / SHAKE_FREQ_Y) * 0.6,
  };
}

export function tilePhase(hue: number): number {
  return (hue / 360) * Math.PI * 2;
}

export function tileRotation(hue: number): number {
  return (((hue % 23) / 22) * 2 - 1) * ROTATION_SPREAD_DEGREES;
}

export function tileSway(hue: number, timeMs: number): number {
  return (
    Math.sin((timeMs / SWAY_PERIOD_MS) * Math.PI * 2 + tilePhase(hue)) *
    SWAY_AMPLITUDE
  );
}

export function popProgress(timeMs: number, spawnedAtMs: number): number {
  return clamp((timeMs - spawnedAtMs) / POP_IN_MS, 0, 1);
}

export function landedFade(
  timeMs: number,
  landedAtMs: number | null,
  lingerMs: number
): number {
  if (landedAtMs === null || lingerMs <= 0) {
    return 1;
  }
  return clamp(1 - (timeMs - landedAtMs) / lingerMs, 0, 1);
}

export function fuseFlicker(hue: number, timeMs: number): number {
  const wave = Math.sin(
    (timeMs / FUSE_FLICKER_PERIOD_MS) * Math.PI * 2 + tilePhase(hue)
  );
  return 0.62 + 0.38 * ((wave + 1) / 2);
}

export function junkBlink(timeMs: number): number {
  const wave = Math.sin((timeMs / JUNK_BLINK_PERIOD_MS) * Math.PI * 2);
  return wave > 0 ? 1 : 0.25;
}

export function cloudDrift(
  baseX: number,
  speed: number,
  timeMs: number
): number {
  const drifted = baseX + (speed * timeMs) / 1000;
  return (((drifted + CLOUD_WRAP_OFFSET) % CLOUD_WRAP) + CLOUD_WRAP) % CLOUD_WRAP - CLOUD_WRAP_OFFSET;
}
