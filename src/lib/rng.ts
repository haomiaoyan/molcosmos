/**
 * Deterministic pseudo-random number generation for MolCosmos.
 *
 * The whole universe is rebuilt from fixed seeds: every visitor sees the
 * exact same stars, and every test run reproduces the same molecules.
 */

export type Rng = () => number

/** Linear congruential generator — same scheme SeqLens used, kept for familiarity. */
export function makeRng(seed: number): Rng {
  let state = seed >>> 0
  if (state === 0) state = 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/** FNV-1a string hash, used to derive small per-molecule jitters from ids. */
export function hashString(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
