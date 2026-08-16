export interface Rng {
  seed: number;
}

export function createRng(seed: number): Rng {
  return { seed: seed >>> 0 };
}

export function cloneRng(rng: Rng): Rng {
  return { seed: rng.seed };
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

export function nextFloat(rng: Rng): number {
  rng.seed = (rng.seed + 0x6d2b79f5) >>> 0;
  let t = rng.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function nextInt(rng: Rng, min: number, max: number): number {
  return Math.floor(nextFloat(rng) * (max - min + 1)) + min;
}

export function nextRange(rng: Rng, min: number, max: number): number {
  return min + nextFloat(rng) * (max - min);
}

export function pickChar(rng: Rng, pool: string): string {
  return pool.charAt(nextInt(rng, 0, pool.length - 1));
}
