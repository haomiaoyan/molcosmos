import { describe, expect, it } from 'vitest'
import { AXIS_BREAKPOINT_PX, revealAt } from './TimelineAxis'

/**
 * The arrival curve is the only arithmetic in the axis, and it fails in the one
 * way a browser will not show you: a node whose window never closes simply stays
 * translated 12px to the right and half transparent, which at five nodes reads as
 * a slightly ragged column rather than as a bug.
 */

const COUNT = 5

describe('revealAt', () => {
  it('has every node fully arrived at the end of the scrub', () => {
    // This is the case that catches a missing `(index - 1)` in the window start:
    // node 4 would need p > 1 and never arrive, at any scroll position.
    for (let i = 0; i < COUNT; i += 1) {
      expect(revealAt(i, COUNT, 1)).toBe(1)
    }
  })

  it('leaves the later nodes still unstarted at the top of the chapter', () => {
    // Node 0's window starts at -step, so it is already fully arrived at p = 0 —
    // deliberately: it is the origin of the axis, and there is no earlier stretch
    // of line for it to emerge from. The rest must not be, or the chapter would
    // show five labels at final position before the line has grown at all.
    expect(revealAt(0, COUNT, 0)).toBe(1)
    expect(revealAt(1, COUNT, 0)).toBe(0)
    expect(revealAt(2, COUNT, 0)).toBe(0)
    expect(revealAt(3, COUNT, 0)).toBe(0)
    expect(revealAt(4, COUNT, 0)).toBe(0)
  })

  it('brings a node in over exactly one segment, ending on its own marker', () => {
    // Node 2's window is [(2-1)*step, 2*step] = [0.25, 0.5]. The endpoint is the
    // node's own marker position, which is what "it arrives as the axis passes
    // it" means: any later and the line is already past the dot it reveals.
    expect(revealAt(2, COUNT, 0.25)).toBe(0)
    expect(revealAt(2, COUNT, 0.5)).toBe(1)
    // Strictly between the two ends it is strictly between 0 and 1.
    expect(revealAt(2, COUNT, 0.375)).toBeGreaterThan(0)
    expect(revealAt(2, COUNT, 0.375)).toBeLessThan(1)
  })

  it('never runs backwards as the scrub advances', () => {
    let previous = -1
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const value = revealAt(3, COUNT, Math.min(1, p))
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('clamps outside 0..1 rather than extrapolating', () => {
    // ScrollTrigger reports values a hair past 1 on fractional device pixel
    // ratios; an unclamped smoothstep there returns opacity > 1 and a negative
    // translate, which Chrome renders as a flicker at the very end.
    expect(revealAt(0, COUNT, -0.4)).toBe(0)
    expect(revealAt(4, COUNT, 1.4)).toBe(1)
  })

  it('has nothing to stagger when there is one node', () => {
    // A single-node timeline is a legitimate edit of NODES, and `step` would be
    // a division by zero: every node has to be fully present instead.
    expect(revealAt(0, 1, 0)).toBe(1)
    expect(revealAt(0, 1, 0.5)).toBe(1)
  })

  it('exposes the breakpoint the CSS media query is written against', () => {
    // Two places encode this number — this module's matchMedia string and the
    // `@media (max-width: 767px)` block — and they must stay on the same side of
    // it, or a 767px window gets neither the trigger nor the gutter layout.
    expect(AXIS_BREAKPOINT_PX).toBe(768)
  })
})
