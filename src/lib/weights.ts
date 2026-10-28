/**
 * The five terms of the teaching score, exposed as adjustable weights.
 *
 * `druglikenessScore` in `molecule.ts` hard-codes 0.30/0.25/0.15/0.15/0.15.
 * This module makes the same maths reachable from the UI so students can watch
 * the whole galaxy re-sort itself when a weight changes.
 *
 * Two rules keep the sandbox honest:
 *
 * 1. Weights are **normalised to sum to 1**. Without that, dropping four terms
 *    to zero would leave a maximum score of 0.30 and every star would look
 *    "worse" purely because of the arithmetic. Normalising means a molecule's
 *    score still spans 0–1 and only its *ranking* changes.
 * 2. Each term keeps its own Gaussian. The sandbox moves emphasis between
 *    terms; it never redefines what a term means.
 *
 * This module deliberately imports nothing at runtime from `molecule.ts`, so
 * `molecule.ts` can depend on it without a cycle.
 */

import type { MoleculeProps } from './molecule'

export type WeightKey = 'mw' | 'logP' | 'hbd' | 'hba' | 'rings'

export type Weights = Record<WeightKey, number>

/** Term order used by the sliders, the radar chart and the diff table. */
export const WEIGHT_KEYS: readonly WeightKey[] = ['mw', 'logP', 'hbd', 'hba', 'rings']

/** The defaults reproduce `druglikenessScore()` exactly. */
export const DEFAULT_WEIGHTS: Weights = {
  mw: 0.3,
  logP: 0.25,
  hbd: 0.15,
  hba: 0.15,
  rings: 0.15,
}

/** Ideal value and Gaussian width for each term — mirrors `druglikenessScore`. */
export const WEIGHT_TERMS: Record<WeightKey, { ideal: number; width: number }> = {
  mw: { ideal: 350, width: 130 },
  logP: { ideal: 2.5, width: 1.7 },
  hbd: { ideal: 2, width: 1.6 },
  hba: { ideal: 5, width: 2.8 },
  rings: { ideal: 3, width: 1.8 },
}

/** Slider bounds, in the 0–1 weight space. */
export const WEIGHT_MIN = 0
export const WEIGHT_MAX = 1

/** Presets offered next to the sliders. `default` restores the published score. */
export const WEIGHT_PRESETS = {
  default: DEFAULT_WEIGHTS,
  weightOnly: { mw: 1, logP: 0, hbd: 0, hba: 0, rings: 0 },
  lipophilicityOnly: { mw: 0, logP: 1, hbd: 0, hba: 0, rings: 0 },
} as const satisfies Record<string, Weights>

export type WeightPresetId = keyof typeof WEIGHT_PRESETS

function gaussian(value: number, ideal: number, width: number): number {
  return Math.exp(-((value - ideal) ** 2) / (2 * width ** 2))
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

/** Per-term closeness in 0–1, before any weighting. */
export function termScores(props: MoleculeProps): Record<WeightKey, number> {
  return {
    mw: gaussian(props.mw, WEIGHT_TERMS.mw.ideal, WEIGHT_TERMS.mw.width),
    logP: gaussian(props.logP, WEIGHT_TERMS.logP.ideal, WEIGHT_TERMS.logP.width),
    hbd: gaussian(props.hbd, WEIGHT_TERMS.hbd.ideal, WEIGHT_TERMS.hbd.width),
    hba: gaussian(props.hba, WEIGHT_TERMS.hba.ideal, WEIGHT_TERMS.hba.width),
    rings: gaussian(props.rings, WEIGHT_TERMS.rings.ideal, WEIGHT_TERMS.rings.width),
  }
}

/** Sum of the raw slider values, before normalisation — the UI shows this. */
export function weightSum(weights: Weights): number {
  return WEIGHT_KEYS.reduce((sum, key) => sum + Math.max(0, weights[key] ?? 0), 0)
}

/**
 * Weights scaled so they sum to 1. An all-zero set falls back to defaults so
 * the galaxy never collapses to a single flat score.
 *
 * A set that already sums to 1 is returned untouched: this keeps the default
 * path bit-identical to the original `druglikenessScore`, so no existing
 * ranking or test shifts by a rounding step.
 */
export function normalizeWeights(weights: Weights): Weights {
  const total = weightSum(weights)
  if (total <= 1e-9) return { ...DEFAULT_WEIGHTS }
  if (Math.abs(total - 1) < 1e-9) {
    return {
      mw: Math.max(0, weights.mw),
      logP: Math.max(0, weights.logP),
      hbd: Math.max(0, weights.hbd),
      hba: Math.max(0, weights.hba),
      rings: Math.max(0, weights.rings),
    }
  }
  return {
    mw: Math.max(0, weights.mw) / total,
    logP: Math.max(0, weights.logP) / total,
    hbd: Math.max(0, weights.hbd) / total,
    hba: Math.max(0, weights.hba) / total,
    rings: Math.max(0, weights.rings) / total,
  }
}

/** The teaching score under an arbitrary weight set, normalised to 0–1. */
export function scoreWithWeights(props: MoleculeProps, weights: Weights): number {
  const w = normalizeWeights(weights)
  const s = termScores(props)
  const raw = WEIGHT_KEYS.reduce((sum, key) => sum + w[key] * s[key], 0)
  return round3(clamp01(raw))
}

/** True when the weights still match the published defaults. */
export function isDefaultWeights(weights: Weights): boolean {
  const w = normalizeWeights(weights)
  return WEIGHT_KEYS.every((key) => Math.abs(w[key] - DEFAULT_WEIGHTS[key]) < 1e-6)
}

/** Serialise weights into a compact, URL-safe form: `30-25-15-15-15`. */
export function encodeWeights(weights: Weights): string {
  return WEIGHT_KEYS.map((key) => Math.round(clamp01(weights[key]) * 100)).join('-')
}

/** Parse the compact form; returns null when malformed so callers keep defaults. */
export function decodeWeights(text: string): Weights | null {
  const parts = text.split('-')
  if (parts.length !== WEIGHT_KEYS.length) return null
  const nums = parts.map((part) => Number(part))
  if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > 100)) return null
  const weights = {} as Weights
  WEIGHT_KEYS.forEach((key, i) => {
    weights[key] = nums[i] / 100
  })
  return weights
}

/** Slider value (0–100 integer) for one term. */
export function sliderValue(weights: Weights, key: WeightKey): number {
  return Math.round(clamp01(weights[key]) * 100)
}

/** Apply one slider change, expressed in 0–100. */
export function withSlider(weights: Weights, key: WeightKey, value: number): Weights {
  return { ...weights, [key]: clamp01(value / 100) }
}
