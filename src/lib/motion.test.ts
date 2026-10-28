import { afterEach, describe, expect, it, vi } from 'vitest'
import { prefersReducedMotion, REDUCED_MOTION_QUERY } from './motion'

/** Builds the smallest matchMedia stub that answers one query. */
function stubMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = []
  const media = {
    matches,
    media: REDUCED_MOTION_QUERY,
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (_: string, fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  const matchMedia = vi.fn((query: string) => {
    expect(query).toBe(REDUCED_MOTION_QUERY)
    return media
  })
  vi.stubGlobal('window', { matchMedia })
  return { matchMedia, listeners }
}

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports the setting when the OS asks for less motion', () => {
    stubMatchMedia(true)
    expect(prefersReducedMotion()).toBe(true)
  })

  it('reports no preference when the OS does not ask', () => {
    stubMatchMedia(false)
    expect(prefersReducedMotion()).toBe(false)
  })

  it('queries the reduced-motion media feature, not some other one', () => {
    const { matchMedia } = stubMatchMedia(false)
    prefersReducedMotion()
    expect(matchMedia).toHaveBeenCalledTimes(1)
    expect(matchMedia.mock.calls[0][0]).toBe('(prefers-reduced-motion: reduce)')
  })

  it('assumes full motion when the browser has no matchMedia', () => {
    vi.stubGlobal('window', {})
    expect(prefersReducedMotion()).toBe(false)
  })

  it('assumes full motion when matchMedia throws', () => {
    vi.stubGlobal('window', {
      matchMedia: () => {
        throw new Error('nope')
      },
    })
    expect(prefersReducedMotion()).toBe(false)
  })

  it('assumes full motion outside a browser', () => {
    vi.stubGlobal('window', undefined)
    expect(prefersReducedMotion()).toBe(false)
  })
})