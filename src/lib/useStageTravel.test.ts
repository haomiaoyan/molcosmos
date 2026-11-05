import { describe, expect, it } from 'vitest'
import { stageFrame, stageSpan, stageTravel, type StageGeometry } from './useStageTravel'

/**
 * The numbers below are the measured ones from SDS §4.5, not round figures
 * chosen to make the maths look neat:
 *
 *   5 cards × 380 + 4 gaps × 56 = 2124 (content)
 *   + the track's 24px side padding  = 2172 (`scrollWidth`, padding included)
 *   `.app` is `max-width: 1180` with `padding: 0 24px`, so the window the
 *   track is clipped by is 1132 — not 1180, and not `innerWidth`.
 *
 * Anything that re-derives these from `innerWidth` collapses travel on a wide
 * screen (measured: 0 at 2560 in the v1 implementation), which is the bug this
 * whole module exists to prevent.
 */
const DESKTOP: StageGeometry = {
  trackWidth: 2172,
  windowWidth: 1132,
  cardCount: 5,
  gap: 56,
  pad: 24,
}

/** 1440 / 1920 / 2560 all resolve to the same geometry — that is the point. */
const WIDE_SCREENS = [
  { label: '1440', geometry: DESKTOP },
  { label: '1920', geometry: DESKTOP },
  { label: '2560', geometry: DESKTOP },
]

describe('stageTravel', () => {
  for (const { label, geometry } of WIDE_SCREENS) {
    it(`is 1040 at ${label} because the window is the .app content box, not the viewport`, () => {
      expect(stageTravel(geometry)).toBe(1040)
    })
  }

  it('grows to 1472 on a 700px viewport, where the window is the viewport itself', () => {
    // Below `max-width`, `.app` is the viewport, so the window shrinks and the
    // track has 1472px more to give.
    expect(stageTravel({ ...DESKTOP, windowWidth: 700 })).toBe(1472)
  })

  it('is 0 when the track is narrower than the window', () => {
    // Negative travel would translate the track right and expose empty space
    // on the left; a fit is a fit, not a small backwards scroll.
    expect(stageTravel({ ...DESKTOP, trackWidth: 1000, windowWidth: 1132 })).toBe(0)
  })
})

describe('stageSpan', () => {
  it('follows the 3.5× travel ratio when travel dominates', () => {
    expect(stageSpan(DESKTOP, 900)).toBe(3640)
  })

  it('never pins for less than 1.5 viewport heights', () => {
    // A very tall viewport with little travel: the pin still needs enough
    // scroll to read as a deliberate hold rather than a hitch.
    expect(stageSpan(DESKTOP, 4000)).toBe(6000)
  })
})

describe('stageFrame', () => {
  it('maps progress 0.5 to x −520, card 2, half the progress bar', () => {
    expect(stageFrame(DESKTOP, 0.5)).toEqual({ x: -520, activeIndex: 2, fillPercent: 50 })
  })

  it('maps progress 1 to x −1040, card 4, full bar', () => {
    // Index 4, not 5: the last card is `cardCount - 1`. Off-by-one here lights
    // "06 / 05" on the counter at the end of the pin.
    expect(stageFrame(DESKTOP, 1)).toEqual({ x: -1040, activeIndex: 4, fillPercent: 100 })
  })

  it('clamps progress just past the end instead of running off the track', () => {
    // ScrollTrigger reports 1.0000001 at the boundary on fractional device
    // pixel ratios; unclamped this translates the last card off-screen left.
    expect(stageFrame(DESKTOP, 1.0000001)).toEqual(stageFrame(DESKTOP, 1))
  })

  it('clamps negative progress to the first card', () => {
    expect(stageFrame(DESKTOP, -0.2)).toEqual({ x: 0, activeIndex: 0, fillPercent: 0 })
  })

  it('returns card 0 for an empty track rather than index −1', () => {
    const empty: StageGeometry = { ...DESKTOP, trackWidth: 0, cardCount: 0 }
    expect(stageFrame(empty, 0.5)).toEqual({ x: 0, activeIndex: 0, fillPercent: 50 })
  })
})
