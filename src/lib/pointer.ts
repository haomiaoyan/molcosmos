/**
 * Mouse parallax for the opening screen.
 *
 * The hero is the one place on this page where the backdrop is allowed to
 * react: moving the pointer tilts the light behind the title instead of
 * scrolling past it. Two rules keep that from becoming noise:
 *
 * 1. The pointer is only read while it is over the hero, and the whole layer
 *    eases back to rest when it leaves — a page that keeps drifting under a
 *    stationary cursor feels broken rather than alive.
 * 2. Nothing here moves text. The title gets a highlight that follows the
 *    pointer (`--mx`/`--my`), never a transform: a headline that slides away
 *    from the thing it describes is worse than a still one.
 *
 * Reduced motion is handled by not attaching any listener at all, so the
 * values stay at their 50% defaults and everything renders centred.
 *
 * ## Two boxes, on purpose
 *
 * The light follows the pointer across the *whole viewport*, but the parallax
 * and the title highlight are normalised against the narrow `.hero` column.
 * Those are different frames, and using one for both is what produced the
 * dead zone this module now avoids: the light lives in `.hero__stage`, which
 * is full-bleed (`calc(100vw - var(--sbw))`), while `.hero` is capped by
 * `.app { max-width: 1180px }` — at 1440px that is 0..1440 against 130..1310.
 * Measured, the pointer read `--m-on: 0` for clientX 100 and 1420, i.e. the
 * light vanished over 18% of the width at 1440, 39% at 1920 and 54% at 2560.
 * So: `--px`/`--py`/`--m-on` come from the surface, `--mx`/`--my` from the
 * hero.
 */

import { useEffect, useRef, useState, type RefObject } from 'react'
import { prefersReducedMotion } from './motion'

export interface PointerField {
  /** 0..1 across the hero, 0.5 = centre. Drives the parallax and the title. */
  x: number
  /** 0..1 down the hero, 0.5 = centre. */
  y: number
  /**
   * Pointer position in viewport px, measured inside the surface box (the same
   * space as `clientX/clientY` when the stage starts at the viewport edge).
   *
   * Deliberately NOT relative to the hero's content box: the cursor light is
   * absolutely positioned inside `.hero__stage`, which is a full-bleed layer
   * centred with `left: 50%` + `translateX(-50%)`. Hero-local numbers put the
   * light 154px off (measured) because they exclude `.hero`'s side padding.
   */
  vx: number
  vy: number
  /** True while the pointer is inside the surface AND the hero is on screen. */
  inside: boolean
}

/** The slice of a `DOMRect` this module needs, so the maths stays testable. */
export interface PointerBox {
  left: number
  top: number
  width: number
  height: number
}

export interface PointerFieldInput {
  clientX: number
  clientY: number
  /** `.hero`'s box: source of `x`/`y` and, without a surface, of `vx`/`vy`. */
  hero: PointerBox
  /** `.hero__stage`'s box: source of `vx`/`vy` and of the hit test. */
  surface?: PointerBox | null
  /** The `IntersectionObserver` verdict — false once the hero has scrolled out. */
  heroVisible?: boolean
  /**
   * Only used by the surface-less fallback, which reproduces the old
   * "viewport X" pixel value. The hook passes `window.innerWidth`; the default
   * just keeps the value finite for a caller that measures nothing.
   */
  viewportWidth?: number
}

const REST: PointerField = { x: 0.5, y: 0.5, vx: 0, vy: 0, inside: false }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

const contains = (box: PointerBox, x: number, y: number) =>
  x >= box.left && x <= box.left + box.width && y >= box.top && y <= box.top + box.height

/**
 * How much of the hero has to be on screen for the light to be allowed on.
 *
 * `IntersectionObserver` rather than a scroll listener: this fires only when
 * the ratio actually crosses the threshold, so it costs nothing during the
 * scroll — which matters because the page's own scrolling is driven by gsap
 * ScrollTrigger and two scroll handlers on the main thread compete badly.
 *
 * 0.05 is a guess, not a measurement: it is the point where the hero's top row
 * of buttons is still visible, so a reader who is scrolling back up gets the
 * light back rather than having it appear only after the headline returns.
 */
export const HERO_VISIBLE_RATIO = 0.05

/**
 * Folds one pointer position into the numbers the hero publishes.
 *
 * Pure, and kept out of the hook so all of it can be pinned by tests in the
 * node environment (this project has no jsdom).
 *
 * `inside` is the `--m-on` decision and needs both conditions: the pointer is
 * over the surface box (Q1 — follow to the screen edges) and the hero is still
 * intersecting the viewport (Q3 — collapse once it is scrolled past). Either
 * one alone reproduces a bug: box only leaves the light burning over section 4
 * on a long page (the stage is as tall as the hero, and a stationary pointer
 * stays inside its old box), visibility only puts the light back in the middle
 * of the screen at a viewport edge.
 */
export function pointerField({
  clientX,
  clientY,
  hero,
  surface = null,
  heroVisible = true,
  viewportWidth,
}: PointerFieldInput): PointerField {
  // A zero-sized box is normal for one frame during layout; dividing by it
  // writes `Infinity` into a transform and the layer disappears for good.
  if (hero.width <= 0 || hero.height <= 0) return REST
  if (surface && (surface.width <= 0 || surface.height <= 0)) return REST

  // The frame `--px`/`--py` are measured in, and the box that decides whether
  // the pointer counts. Without a surface both fall back to the old
  // single-ref behaviour: viewport X, hero-local Y, hero-sized hit test.
  const frame: PointerBox = surface ?? {
    left: 0,
    top: hero.top,
    width: viewportWidth ?? hero.left + hero.width,
    height: hero.height,
  }
  const hit = surface ?? hero

  return {
    x: clamp((clientX - hero.left) / hero.width, 0, 1),
    y: clamp((clientY - hero.top) / hero.height, 0, 1),
    vx: clamp(clientX - frame.left, 0, frame.width),
    vy: clamp(clientY - frame.top, 0, frame.height),
    inside: heroVisible && contains(hit, clientX, clientY),
  }
}

/**
 * Tracks the pointer over the hero and returns it as normalised coordinates plus
 * the raw position inside `surface`.
 *
 * The listener is on the window rather than on the element, and the hit test in
 * {@link pointerField} does the filtering. Attaching it to `.hero__stage` is not
 * an option: that layer is `pointer-events: none` (it must not intercept the
 * hero's buttons), so a listener there never fires — which is precisely the
 * dead zone being fixed. The window also catches the move that lands exactly on
 * the last pixel of the screen edge, where an element-scoped event can be lost
 * to the scrollbar gutter.
 */
export function usePointerField<T extends HTMLElement = HTMLElement>(
  surfaceRef?: RefObject<HTMLElement>,
) {
  const ref = useRef<T | null>(null)
  const [field, setField] = useState<PointerField>(REST)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

    let frame = 0
    let next: PointerField = REST
    let visible = true

    const flush = () => {
      frame = 0
      setField(next)
    }

    const schedule = () => {
      // One update per frame: pointermove fires far more often than the page
      // can usefully repaint, and each call re-renders the hero.
      if (!frame) frame = requestAnimationFrame(flush)
    }

    const onMove = (event: PointerEvent) => {
      // Nothing to show while the hero is scrolled past, and on a long page
      // this handler otherwise runs — and re-renders — for every move.
      if (!visible) return

      const surface = surfaceRef?.current ?? null
      const hero = el.getBoundingClientRect()
      const measured = pointerField({
        clientX: event.clientX,
        clientY: event.clientY,
        hero,
        surface: surface ? surface.getBoundingClientRect() : null,
        heroVisible: visible,
        viewportWidth: window.innerWidth,
      })

      // Keep the light where it was when it switches off: `--m-on` fades it
      // out in place, and letting `--px` jump to 0 would drag the bloom into
      // the top-left corner on its way out. The parallax halves do go back to
      // rest, which is the "eases back" behaviour the header promises.
      next = measured.inside ? measured : { ...REST, vx: measured.vx, vy: measured.vy }
      schedule()
    }

    const onLeave = () => {
      next = REST
      schedule()
    }

    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1]
          // `>=` rather than `>`: the observer reports exactly the threshold
          // value at the moment it crosses, and a strict comparison would
          // switch the light off on the very callback that says "entering".
          visible = entry.isIntersecting && entry.intersectionRatio >= HERO_VISIBLE_RATIO
          if (visible) return
          next = { ...REST, vx: next.vx, vy: next.vy }
          schedule()
        },
        { threshold: HERO_VISIBLE_RATIO },
      )
      observer.observe(el)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      observer?.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [surfaceRef])

  return { ref, field }
}

/**
 * Writes the field onto an element as CSS custom properties.
 *
 * Kept as a string because React cannot type custom properties; callers spread
 * it into `style`. Values are rounded to 4 decimals so the inline style does
 * not churn on every sub-pixel change.
 */
export function pointerVars(field: PointerField): Record<string, string> {
  const r = (n: number) => Math.round(n * 10000) / 10000
  return {
    '--mx': String(r(field.x)),
    '--my': String(r(field.y)),
    '--mpx': `${r(field.x * 100)}%`,
    '--mpy': `${r(field.y * 100)}%`,
    // Surface-local X and Y, for the cursor light inside `.hero__stage`.
    '--px': `${Math.round(field.vx)}px`,
    '--py': `${Math.round(field.vy)}px`,
    '--m-on': field.inside ? '1' : '0',
  }
}
