export const POP_IN_MS = 220;

const SWAY_PERIOD_MS = 1400;

const SWAY_AMPLITUDE = 0.035;

const ROTATION_SPREAD_DEGREES = 3.5;

const FUSE_FLICKER_PERIOD_MS = 190;

const JUNK_BLINK_PERIOD_MS = 620;

const CLOUD_WRAP = 1.5;

const CLOUD_WRAP_OFFSET = 0.35;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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
