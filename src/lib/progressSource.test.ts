import { describe, expect, it } from 'vitest'
import { progressSource } from './useReveal'

/**
 * The progress bar's data source, and the bug this guards against.
 *
 * The bar was wired to a ScrollTrigger while the reduced-motion branch created
 * no trigger at all — so the readout sat at zero forever for exactly the readers
 * who need a non-motion way to orient themselves. The fix is a fallback, and the
 * decision is what goes wrong if it is ever "simplified" back to one branch.
 */

describe('progressSource', () => {
  it('uses a ScrollTrigger when the reader accepts motion', () => {
    expect(progressSource(false)).toBe('scroll-trigger')
  })

  it('falls back to a plain listener instead of leaving the bar dead', () => {
    // `undefined` here would mean no source at all; the type rules it out, and
    // this pins the value so a future edit cannot quietly reintroduce it.
    expect(progressSource(true)).toBe('scroll-listener')
  })

  it('never returns a source that depends on triggers existing', () => {
    for (const reduced of [true, false]) {
      expect(['scroll-trigger', 'scroll-listener']).toContain(progressSource(reduced))
    }
  })
})

