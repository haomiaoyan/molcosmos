import { describe, expect, it } from 'vitest'
import { druglikenessScore, generateMoleculeProps, seedForIndex } from './molecule'
import {
  DEFAULT_WEIGHTS,
  WEIGHT_KEYS,
  WEIGHT_PRESETS,
  decodeWeights,
  encodeWeights,
  isDefaultWeights,
  normalizeWeights,
  scoreWithWeights,
  sliderValue,
  termScores,
  weightSum,
  withSlider,
} from './weights'

const props = (index: number) => generateMoleculeProps(seedForIndex(index))

describe('weights', () => {
  it('reproduces the hard-coded score exactly under default weights', () => {
    for (let i = 0; i < 200; i++) {
      const p = props(i)
      expect(scoreWithWeights(p, DEFAULT_WEIGHTS)).toBe(druglikenessScore(p))
    }
  })

  it('keeps every score inside 0..1', () => {
    const sets = [DEFAULT_WEIGHTS, ...Object.values(WEIGHT_PRESETS)]
    for (const weights of sets) {
      for (let i = 0; i < 100; i++) {
        const score = scoreWithWeights(props(i), weights)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      }
    }
  })

  it('normalises weights that do not sum to one', () => {
    const w = normalizeWeights({ mw: 3, logP: 1, hbd: 0, hba: 0, rings: 0 })
    expect(weightSum(w)).toBeCloseTo(1, 9)
    expect(w.mw).toBeCloseTo(0.75, 9)
    expect(w.logP).toBeCloseTo(0.25, 9)
  })

  it('leaves an already-normalised set untouched', () => {
    expect(normalizeWeights(DEFAULT_WEIGHTS)).toEqual(DEFAULT_WEIGHTS)
  })

  it('falls back to defaults when every weight is zero', () => {
    const zero = { mw: 0, logP: 0, hbd: 0, hba: 0, rings: 0 }
    expect(normalizeWeights(zero)).toEqual(DEFAULT_WEIGHTS)
    // And the score must still be a real score, not a flat zero.
    expect(scoreWithWeights(props(0), zero)).toBe(druglikenessScore(props(0)))
  })

  it('reproduces the documented behaviour of each single-term preset', () => {
    // Weight-only scoring gives a high mean because most molecules cluster
    // near the weight ideal; logP-only is far harsher. These are the numbers
    // quoted in the spec doc, so guard them.
    const mean = (weights: typeof DEFAULT_WEIGHTS) => {
      let sum = 0
      for (let i = 0; i < 600; i++) sum += scoreWithWeights(props(i), weights)
      return sum / 600
    }
    const defaultMean = mean(DEFAULT_WEIGHTS)
    const weightOnlyMean = mean(WEIGHT_PRESETS.weightOnly)
    const logPOnlyMean = mean(WEIGHT_PRESETS.lipophilicityOnly)

    expect(defaultMean).toBeGreaterThan(0.6)
    expect(defaultMean).toBeLessThan(0.75)
    expect(weightOnlyMean).toBeGreaterThan(defaultMean)
    expect(logPOnlyMean).toBeLessThan(defaultMean)
    expect(logPOnlyMean).toBeLessThan(0.45)
  })

  it('gives every term a peak score of one at its ideal', () => {
    const scores = termScores({ mw: 350, logP: 2.5, hbd: 2, hba: 5, rings: 3, counts: { C: 10, N: 0, O: 0, S: 0 } })
    for (const key of WEIGHT_KEYS) {
      expect(scores[key]).toBeCloseTo(1, 9)
    }
  })

  it('detects the default weights', () => {
    expect(isDefaultWeights(DEFAULT_WEIGHTS)).toBe(true)
    expect(isDefaultWeights({ ...DEFAULT_WEIGHTS, mw: 0.5 })).toBe(false)
    // A scaled-but-equivalent set still counts as default after normalisation.
    expect(isDefaultWeights({ mw: 0.6, logP: 0.5, hbd: 0.3, hba: 0.3, rings: 0.3 })).toBe(true)
  })

  it('round-trips through the compact encoding', () => {
    const encoded = encodeWeights(DEFAULT_WEIGHTS)
    expect(encoded).toBe('30-25-15-15-15')
    expect(decodeWeights(encoded)).toEqual(DEFAULT_WEIGHTS)
  })

  it('rejects malformed encodings', () => {
    expect(decodeWeights('')).toBeNull()
    expect(decodeWeights('30-25-15')).toBeNull()
    expect(decodeWeights('30-25-15-15-999')).toBeNull()
    expect(decodeWeights('a-b-c-d-e')).toBeNull()
  })

  it('maps sliders to 0..100 integers', () => {
    expect(sliderValue(DEFAULT_WEIGHTS, 'mw')).toBe(30)
    const changed = withSlider(DEFAULT_WEIGHTS, 'mw', 55)
    expect(changed.mw).toBeCloseTo(0.55, 9)
    expect(sliderValue(changed, 'mw')).toBe(55)
  })

  it('clamps out-of-range slider values', () => {
    expect(withSlider(DEFAULT_WEIGHTS, 'mw', 500).mw).toBe(1)
    expect(withSlider(DEFAULT_WEIGHTS, 'mw', -20).mw).toBe(0)
  })

  it('changes ranking but not the property values', () => {
    // The sandbox must not mutate the molecule itself.
    const p = props(7)
    const before = { ...p }
    scoreWithWeights(p, WEIGHT_PRESETS.lipophilicityOnly)
    expect(p).toEqual(before)
  })
})
