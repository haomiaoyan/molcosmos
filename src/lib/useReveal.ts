import { useLayoutEffect, useRef } from 'react'
import { gsap, registerGsap } from './gsap'
import { prefersReducedMotion } from './motion'

/**
 * Section entrance: a short rise, one step after another, once.
 *
 * The hard rule here is the same one `motion.ts` states: **motion may stop,
 * information may not.** Every element is rendered visible by default and only
 * ever *animated* into place, so a reader with reduced motion — or a reader
 * whose JavaScript failed — sees the whole page. Never put `opacity: 0` for
 * this in CSS; that is how content disappears for good.
 */

export interface RevealOptions {
  /** Selectors for the elements to bring in, in the order they should arrive. */
  steps: string[]
  /** Delay between steps, ms. */
  stagger?: number
  /** Distance risen, px. */
  rise?: number
  /** ScrollTrigger start, e.g. `'top 82%'`. */
  start?: string
}

export const DEFAULT_STAGGER = 70
export const DEFAULT_RISE = 24
export const DEFAULT_START = 'top 82%'
/** Full-length scroll tween for the nav links and the brand button. */
export const SCROLL_DURATION = 0.8

/**
 * How long a scroll-to-element tween should run.
 *
 * Reduced motion must not mean "the button does nothing": the jump still
 * happens, it just stops being a journey. Zero duration keeps the navigation
 * working and satisfies assertion 5 (no ScrollTriggers) and the wider rule that
 * motion may stop while information may not.
 */
export function scrollDuration(reduced: boolean = prefersReducedMotion()): number {
  return reduced ? 0 : SCROLL_DURATION
}

/**
 * Which mechanism feeds the scroll-progress bar.
 *
 * There is a fallback on purpose. Wiring the bar only to a ScrollTrigger means a
 * reduced-motion reader — who gets no triggers — watches a readout that never
 * moves. Motion may stop; information may not.
 */
export function progressSource(reduced: boolean): 'scroll-trigger' | 'scroll-listener' {
  return reduced ? 'scroll-listener' : 'scroll-trigger'
}

export interface RevealStep {
  selector: string
  /** Seconds, already accumulated for `gsap.from`. */
  delay: number
}

export interface RevealPlan {
  enabled: boolean
  steps: RevealStep[]
  stagger: number
  rise: number
  start: string
}

/**
 * Resolves the options into the exact list a tween would run.
 *
 * Kept pure and separate from the hook for one reason: the ordering and timing
 * rules are the part that can be wrong without a browser, so they are pinned by
 * unit tests instead of by looking at the page.
 */
export function revealPlan(options: RevealOptions, reduced: boolean): RevealPlan {
  const stagger = options.stagger ?? DEFAULT_STAGGER
  const rise = options.rise ?? DEFAULT_RISE
  const start = options.start ?? DEFAULT_START

  if (reduced) {
    // No tween at all — assertion 5 of verify.mjs counts ScrollTriggers and
    // expects zero when the reader has asked for less motion.
    return { enabled: false, steps: [], stagger, rise, start }
  }

  const steps: RevealStep[] = []
  options.steps.forEach((raw, slot) => {
    const selector = raw.trim()
    // A blank selector is dropped, but it keeps its slot: one typo must not
    // silently retime every step after it.
    if (!selector) return
    steps.push({ selector, delay: (slot * stagger) / 1000 })
  })

  return { enabled: steps.length > 0, steps, stagger, rise, start }
}

/**
 * Returns a ref for a section root. Children matching `steps` rise into place,
 * offset from each other, once the section reaches the trigger line.
 */
export function useReveal<T extends HTMLElement>(options: RevealOptions): React.RefObject<T> {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return

    const plan = revealPlan(options, prefersReducedMotion())
    if (!plan.enabled) return

    registerGsap()

    // `context` collects the triggers and the matching media query, so a
    // single revert undoes the whole thing on unmount, language switch, or a
    // flip of the OS setting.
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add(`(prefers-reduced-motion: no-preference)`, () => {
        const targets = plan.steps.flatMap((step) => gsap.utils.toArray<Element>(step.selector, root))
        if (targets.length === 0) return

        // One tween per step rather than a single staggered one: the selectors
        // resolve inside this root only, and `delay` already encodes the order.
        plan.steps.forEach((step) => {
          const elements = gsap.utils.toArray<Element>(step.selector, root)
          if (elements.length === 0) return
          gsap.from(elements, {
            y: plan.rise,
            opacity: 0,
            duration: 0.5,
            delay: step.delay,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: root,
              start: plan.start,
              once: true,
            },
          })
        })
      })
    }, root)

    return () => ctx.revert()
    // `options` is a fresh object on every render by design; the callers below
    // pass literal arrays, so keying on the serialised steps is what keeps the
    // effect from rebuilding on every keystroke elsewhere in the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.steps.join('|'), options.stagger, options.rise, options.start])

  return ref
}
