/**
 * A tiny seeded random number generator (mulberry32), written as a pure step: the same seed always gives the
 * same number and the same next seed, so a game's state carries its seed and every move can be replayed in tests.
 */
export function nextRandom(seed: number): { value: number; seed: number } {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: next };
}

/** A whole number in [0, n) and the next seed. */
export function randomInt(seed: number, n: number): { value: number; seed: number } {
  const { value, seed: next } = nextRandom(seed);
  return { value: Math.floor(value * n), seed: next };
}

/** Mixes two numbers into a new seed, so level 3 of game 42 always gets the same maze. */
export function mixSeed(a: number, b: number): number {
  return nextRandom((Math.imul(a | 0, 31) + Math.imul(b | 0, 0x9e3779b1)) | 0).seed;
}

/** A fresh seed for a new game. The only impure helper: the engines never call it. */
export function newSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) | 0;
}
