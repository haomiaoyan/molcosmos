/**
 * "Should this page move?" answered in one place.
 *
 * The site is decorative by design — a drifting nebula, a twinkling star field,
 * a molecule that turns on its own. That is exactly the kind of motion that
 * triggers nausea and dizziness for people with vestibular disorders, and the
 * platform already lets them say so. This module is the single answer to that
 * question so no component has to guess.
 *
 * The rule we follow: **motion may stop, information may not.** A pulsing dot
 * becomes a steady dot; a twinkling star field becomes a still one; a camera
 * flight becomes a cut. Nothing that carries meaning is ever removed.
 */

import { useEffect, useState } from 'react'

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Reads the OS setting directly.
 *
 * Guarded because this module is imported by tests and by code that can run
 * before `window` exists; a missing `matchMedia` means "assume full motion",
 * which is the behaviour of every browser that has no such setting.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return false
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches
  } catch {
    return false
  }
}

/** Live version of {@link prefersReducedMotion}, re-rendering when the OS setting flips. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    let media: MediaQueryList
    try {
      media = window.matchMedia(REDUCED_MOTION_QUERY)
    } catch {
      return
    }

    const update = () => setReduced(media.matches)
    update()

    // Safari below 14 only has the deprecated listener API; both paths are one
    // line, so support them rather than dropping the live update there.
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    }
    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

  return reduced
}