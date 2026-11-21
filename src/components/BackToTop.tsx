import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'

interface Props {
  /** The app's existing gsap scrollTo callback (already reduced-motion aware). */
  onTop: () => void
}

/** Show the button once the reader is this far past the top of the document. */
const VISIBLE_AFTER_VIEWPORTS = 0.85

/**
 * Floating "back to top" control.
 *
 * Visual skin adapted from Uiverse's `afraid-falcon-17` by vinodjangid07:
 * a 50px dark circle with a soft ring that expands into a pill on hover,
 * sliding the arrow up while the label rises into its place. The upstream
 * snippet is pure HTML/CSS with a hardcoded English `::before` string and a
 * fixed dark palette; here the copy comes from i18n, the colours come from the
 * active theme's CSS variables, and the class is namespaced so it cannot
 * collide with the generic `.button` used upstream.
 *
 * The behaviour is local: one passive scroll listener, rAF-throttled, and the
 * app's existing gsap `scrollTo` for the click. No new dependency.
 */
export function BackToTop({ onTop }: Props) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setVisible(window.scrollY > window.innerHeight * VISIBLE_AFTER_VIEWPORTS)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const label = t('nav.backToTop')

  return (
    <button
      type="button"
      className={`backtotop${visible ? ' backtotop--visible' : ''}`}
      onClick={onTop}
      aria-label={label}
      title={label}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <svg className="backtotop__icon" viewBox="0 0 384 512" aria-hidden="true" focusable="false">
        <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z" />
      </svg>
      <span className="backtotop__label" aria-hidden="true">{label}</span>
    </button>
  )
}
