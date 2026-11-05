import { describe, expect, it } from 'vitest'
import { DEFAULT_RISE, DEFAULT_STAGGER, DEFAULT_START, SCROLL_DURATION, revealPlan, scrollDuration } from './useReveal'

/**
 * The reveal hook itself needs a DOM to run, and this project deliberately has
 * none in its test environment. Everything that can be got wrong without a
 * browser — the ordering, the delay arithmetic, the defaults, and the
 * reduced-motion contract — lives in `revealPlan`, so it can be pinned here.
 */

describe('revealPlan', () => {
  it('orders the steps and turns the stagger into seconds', () => {
    const plan = revealPlan({ steps: ['.a', '.b', '.c'] }, false)

    expect(plan.steps.map((step) => step.selector)).toEqual(['.a', '.b', '.c'])
    expect(plan.steps.map((step) => step.delay)).toEqual([0, 0.07, 0.14])
  })

  it('honours a custom stagger', () => {
    const plan = revealPlan({ steps: ['h', 'p', 'figure'], stagger: 120 }, false)

    expect(plan.steps.map((step) => step.delay)).toEqual([0, 0.12, 0.24])
    expect(plan.stagger).toBe(120)
  })

  it('falls back to the documented defaults', () => {
    const plan = revealPlan({ steps: ['h'] }, false)

    expect(plan.stagger).toBe(DEFAULT_STAGGER)
    expect(plan.rise).toBe(DEFAULT_RISE)
    expect(plan.start).toBe(DEFAULT_START)
    expect(plan.enabled).toBe(true)
  })

  it('never animates when the reader asked for less motion', () => {
    const plan = revealPlan({ steps: ['h', 'p'], stagger: 70, rise: 24 }, true)

    // Not "delay 0": no tween at all, so the elements keep their natural,
    // already-visible rendering. Assertion 5 of verify.mjs depends on this.
    expect(plan.enabled).toBe(false)
    expect(plan.steps).toEqual([])
  })

  it('drops blank selectors but keeps the remaining order intact', () => {
    const plan = revealPlan({ steps: ['h', '   ', '', 'figure'] }, false)

    expect(plan.steps.map((step) => step.selector)).toEqual(['h', 'figure'])
    // The kept steps are not renumbered: a hidden step still costs its slot,
    // so a typo in one selector cannot silently retime the rest of the page.
    expect(plan.steps.map((step) => step.delay)).toEqual([0, 0.21])
  })

  it('treats a missing step list as an empty plan rather than throwing', () => {
    const plan = revealPlan({ steps: [] }, false)

    expect(plan.enabled).toBe(false)
    expect(plan.steps).toEqual([])
  })
})

describe('scrollDuration', () => {
  it('animates navigation for a reader who accepts motion', () => {
    expect(scrollDuration(false)).toBe(SCROLL_DURATION)
  })

  it('jumps instantly, rather than not at all, when motion is reduced', () => {
    // The distinction matters: `undefined` would make the tween fall back to its
    // own default and animate anyway, which is the exact bug this guards.
    expect(scrollDuration(true)).toBe(0)
  })
})
