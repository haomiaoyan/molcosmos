/**
 * The one place the app registers gsap plugins.
 *
 * Registering from each module that happens to need a plugin looks harmless and
 * is not: ScrollTrigger refreshes its triggers in registration order, so a
 * second registration makes the page's scroll maths depend on which module the
 * bundler evaluated first. Every consumer imports from here, never from `'gsap'`.
 */

import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

let registered = false

/** Idempotent. Safe to call from every component that mounts. */
export function registerGsap(): void {
  if (registered) return
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText)
  registered = true
}

/** True once {@link registerGsap} has run. Used by tests and by nothing else. */
export function isGsapRegistered(): boolean {
  return registered
}

/**
 * Re-measures every trigger once the page has stopped growing.
 *
 * `ScrollTrigger.create({ end: 'max' })` resolves `max` from the document height
 * *at creation time* and caches it. This page grows between mount and the last
 * font swap, so a trigger created during mount keeps a stale ceiling: measured
 * here as a progress bar that read 93% while the page was already at its
 * bottom. `refresh()` re-resolves those cached numbers without rebuilding any
 * trigger, and the same staleness would offset a pinned section by the same
 * ~200px, which is why this lands before the pin batch rather than after.
 */
export function refreshTriggersWhenSettled(): () => void {
  registerGsap()

  let cancelled = false
  const refresh = () => {
    if (cancelled) return
    ScrollTrigger.refresh()
  }

  // The last event that can change layout after mount.
  document.fonts?.ready.then(refresh).catch(() => {})

  // Belt and braces: images, or a stylesheet that arrives late.
  if (document.readyState === 'complete') {
    requestAnimationFrame(refresh)
  } else {
    window.addEventListener('load', refresh, { once: true })
  }

  return () => {
    cancelled = true
    window.removeEventListener('load', refresh)
  }
}

export { gsap, ScrollToPlugin, ScrollTrigger, SplitText }
