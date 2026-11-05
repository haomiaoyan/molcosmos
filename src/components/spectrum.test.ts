import { describe, expect, it } from 'vitest'
import { segmentWidths, MIN_SEGMENT } from './SpectrumStrip'

const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0)

/** Rounded to 3 decimals, which is the resolution the SDS tabulates. */
const rounded = (values: readonly number[]) => values.map((v) => Math.round(v * 1000) / 1000)

describe('segmentWidths', () => {
  it('turns the current census into the widths the strip draws', () => {
    // 53/600, 371/600, 174/600, 2/600. The last one lands exactly on the 0.33%
    // floor, so this input survives lifting untouched — the overflow case is the
    // next test.
    expect(rounded(segmentWidths([53, 371, 174, 2]))).toEqual([8.833, 61.833, 29.0, 0.333])
    expect(sum(segmentWidths([53, 371, 174, 2]))).toBeCloseTo(100, 9)
  })

  it('normalises back to 100 when lifting pushes the total over it', () => {
    // 1/599 = 0.167% → lifted to 0.33% → raw total 100.163%. Without the
    // normalisation step the bar is 0.163% too wide and the last segment is
    // squeezed out by `flex`, which is the bug this case exists to catch.
    const widths = segmentWidths([53, 371, 174, 1])
    expect(rounded(widths)).toEqual([8.834, 61.836, 29.001, 0.329])
    expect(sum(widths)).toBeCloseTo(100, 9)
    expect(sum(widths)).toBeLessThan(100 + 1e-9)
    // The lifted segment is still visibly there — that is the whole point of
    // lifting it in the first place.
    expect(widths[3]).toBeGreaterThan(0)
  })

  it('leaves four equal slices alone', () => {
    expect(segmentWidths([1, 1, 1, 1])).toEqual([25, 25, 25, 25])
  })

  it('gives a single class the whole bar', () => {
    expect(segmentWidths([600, 0, 0, 0])).toEqual([100, 0, 0, 0])
  })

  it('splits evenly between the two classes that have counts', () => {
    expect(segmentWidths([300, 300, 0, 0])).toEqual([50, 50, 0, 0])
  })

  it('returns all zeros for an empty census without dividing by zero', () => {
    expect(segmentWidths([0, 0, 0, 0])).toEqual([0, 0, 0, 0])
  })

  it('keeps a zero count at zero instead of lifting it to the floor', () => {
    // The rule that matters most: a coloured segment with no molecules behind it
    // reads as "there are some here", which is the opposite of the truth. The
    // other three are all tiny, so every one of them gets lifted.
    const widths = segmentWidths([0, 1, 1, 1])
    expect(widths[0]).toBe(0)
    expect(sum(widths)).toBeCloseTo(100, 9)
  })

  it('holds its invariants across a sweep of weight-driven censuses', () => {
    // The sandbox can produce almost any distribution; sweeping the boundary
    // cases is cheaper than reasoning about each one.
    const cases = [
      [0, 0, 0, 1],
      [1, 0, 0, 0],
      [599, 1, 0, 0],
      [1, 599, 0, 0],
      [5, 5, 5, 599],
      [150, 150, 150, 150],
      [0, 0, 300, 300],
    ]
    for (const counts of cases) {
      const widths = segmentWidths(counts)
      expect(widths).toHaveLength(counts.length)
      for (let i = 0; i < counts.length; i += 1) {
        expect(Number.isFinite(widths[i])).toBe(true)
        expect(widths[i]).toBeGreaterThanOrEqual(0)
        if (counts[i] === 0) expect(widths[i]).toBe(0)
        else expect(widths[i]).toBeGreaterThan(0)
      }
      expect(sum(widths)).toBeCloseTo(100, 9)
    }
  })

  it('exposes the 0.33% floor the layout assumes', () => {
    expect(MIN_SEGMENT).toBe(0.33)
  })
})
