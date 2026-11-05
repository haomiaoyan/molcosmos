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
 */

import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './motion'

export interface PointerField {
  /** 0..1 across the hero, 0.5 = centre. */
  x: number
  /** 0..1 down the hero, 0.5 = centre. */
  y: number
  /** True while the pointer is inside the hero. */
  inside: boolean
}

const REST: PointerField = { x: 0.5, y: 0.5, inside: false }

/**
 * Tracks the pointer inside `ref` and returns it as normalised coordinates.
 *
 * The listener is attached to the element rather than the window so the hero
 * does not react to the pointer being somewhere else on a long page.
 */
export function usePointerField<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [field, setField] = useState<PointerField>(REST)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

    let frame = 0
    let next: PointerField = REST

    const flush = () => {
      frame = 0
      setField(next)
    }

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      // Clamp: the pointer can sit outside the box while a child still catches
      // the event, and an unclamped value would push the highlight off the edge.
      next = {
        x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
        inside: true,
      }
      // One update per frame: pointermove fires far more often than the page
      // can usefully repaint, and each call re-renders the hero.
      if (!frame) frame = requestAnimationFrame(flush)
    }

    const onLeave = () => {
      next = REST
      if (!frame) frame = requestAnimationFrame(flush)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

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
    '--m-on': field.inside ? '1' : '0',
  }
}
