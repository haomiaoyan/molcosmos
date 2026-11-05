import { describe, expect, it, vi } from 'vitest'

/**
 * `lib/gsap.ts` is the only place allowed to call `registerPlugin`. Registering
 * twice is not harmless: ScrollTrigger refreshes in registration order, and a
 * second pass makes the page's trigger maths depend on module evaluation order.
 * These tests pin the single-registration guard and the re-exports.
 */

describe('lib/gsap', () => {
  it('registers every plugin exactly once, no matter how often it is called', async () => {
    vi.resetModules()
    const core = await import('gsap')
    const mod = await import('./gsap')

    const spy = vi.spyOn(core.gsap, 'registerPlugin')
    mod.registerGsap()
    mod.registerGsap()
    mod.registerGsap()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(mod.isGsapRegistered()).toBe(true)
    spy.mockRestore()
  })

  it('re-exports the real gsap core and the three plugins it registers', async () => {
    const mod = await import('./gsap')
    const core = await import('gsap')
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    const { ScrollToPlugin } = await import('gsap/ScrollToPlugin')
    const { SplitText } = await import('gsap/SplitText')

    // Identity, not shape: a consumer importing from '../../lib/gsap' must get
    // the same objects the rest of the app registry sees.
    expect(mod.gsap).toBe(core.gsap)
    expect(mod.ScrollTrigger).toBe(ScrollTrigger)
    expect(mod.ScrollToPlugin).toBe(ScrollToPlugin)
    expect(mod.SplitText).toBe(SplitText)
  })

  it('pins the gsap version the SDS was written against', async () => {
    const mod = await import('./gsap')

    expect(mod.gsap.version).toBe('3.15.1')
  })
})
