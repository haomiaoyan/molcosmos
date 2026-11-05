import { useEffect, useRef, useState } from 'react'
import { GITHUB } from '../config'
import { useI18n } from '../lib/i18n'
import type { ThemeId } from '../lib/theme'
import { TopnavTools } from './TopnavTools'

export function MethodSection() {
  const { t } = useI18n()
  const cards = [
    ['method.m1.title', 'method.m1.body'],
    ['method.m2.title', 'method.m2.body'],
    ['method.m3.title', 'method.m3.body'],
    ['method.m4.title', 'method.m4.body'],
  ] as const
  return (
    <section className="section" id="method" aria-labelledby="method-title">
      <header className="section__head">
        <p className="section__eyebrow mono">{t('method.eyebrow')}</p>
        <h2 id="method-title" className="section__title">
          {t('method.title.pre')}
          <span className="accent-text">{t('method.title.accent')}</span>
        </h2>
        <p className="section__lead">{t('method.lead')}</p>
      </header>
      <div className="method-grid">
        {cards.map(([title, body]) => (
          <article key={title} className="method-card">
            <h3>{t(title)}</h3>
            <p>{t(body)}</p>
          </article>
        ))}
      </div>
      <ul className="citation-list">
        <li>{t('cite.chemicalSpace')}</li>
        <li>{t('cite.lipinski')}</li>
        <li>{t('cite.funnel')}</li>
      </ul>
    </section>
  )
}

export function LimitsSection() {
  const { t } = useI18n()
  const items = [
    ['limits.l1.strong', 'limits.l1.body'],
    ['limits.l2.strong', 'limits.l2.body'],
    ['limits.l3.strong', 'limits.l3.body'],
    ['limits.l4.strong', 'limits.l4.body'],
  ] as const
  return (
    <section className="section section--limits" id="limits" aria-labelledby="limits-title">
      <header className="section__head">
        <p className="section__eyebrow mono">{t('limits.eyebrow')}</p>
        <h2 id="limits-title" className="section__title">
          {t('limits.title.pre')}
          <span className="accent-text">{t('limits.title.accent')}</span>
          {t('limits.title.post')}
        </h2>
      </header>
      <ul className="limits-list">
        {items.map(([strong, body]) => (
          <li key={strong}>
            <strong>{t(strong)}</strong>
            {t(body)}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="footer">
      <p>{t('footer.line1')}</p>
      <p className="muted">{t('footer.line2')}</p>
      <p className="footer__links">
        <a href={GITHUB.repo} target="_blank" rel="noreferrer noopener">
          {t('footer.source')} · {GITHUB.owner}/molcosmos
        </a>
        <span className="footer__sep" aria-hidden="true">
          ·
        </span>
        <a href={GITHUB.profile} target="_blank" rel="noreferrer noopener">
          {t('footer.author')} · @{GITHUB.owner}
        </a>
      </p>
    </footer>
  )
}

/**
 * Every section the top nav can point at, in page order.
 *
 * The nav renders from this list *and* the scroll spy measures against it, so
 * adding a section can never again leave the highlight stuck on a neighbour —
 * which is exactly what happened when `links` and the spy's private array drifted
 * apart. `#cosmos` is deliberately absent: the galaxy has no nav entry of its own,
 * so the home item stays lit while the reader is down there.
 */
const NAV_SECTIONS = [
  ['top', 'nav.home'],
  ['pipeline', 'nav.pipeline'],
  ['funnel', 'nav.funnel'],
  ['stats', 'nav.stats'],
  ['compare', 'nav.compare'],
  ['lab', 'nav.lab'],
  ['timeline', 'nav.timeline'],
  ['method', 'nav.method'],
  ['limits', 'nav.limits'],
] as const

/** Small scroll-progress bar + nav, pure decoration for the "冗余 UI" requirement. */
export function Chrome({ onEnter, themeId, onTheme }: { onEnter: () => void; themeId: ThemeId; onTheme: (id: ThemeId) => void }) {
  const { t, lang } = useI18n()
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState('top')
  /** Where the sliding indicator belongs, in px relative to the link row. */
  const [glider, setGlider] = useState<{ x: number; w: number } | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0)
      // Highlight whatever sits under a probe line, rather than "the last section
// whose top has merely crossed it". The old test let a short section lose to its
// neighbour before the reader had finished with it: at a 900px viewport anything
// under 720px tall could never hold the highlight, so compare, stats and method
// all jumped ahead one item.
      const probe = window.innerHeight * 0.35
      let under = ''
      let lastStarted = 'top'
      for (const [id] of NAV_SECTIONS) {
        const el = document.getElementById(id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top > probe) continue
        lastStarted = id
        if (rect.bottom > probe) under = id
      }
      setActive(under || lastStarted)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The indicator is a single element that slides between items instead of one
  // background per item. Measuring the live DOM (rather than multiplying by an
  // item index) keeps it exact when the copy switches language, when the label
  // lengths differ, and when the row is squeezed on a narrow screen.
  //
  // This is deliberately separate from the probe-line highlight above: that
  // decision (`active`) is untouched, and this effect only turns it into pixels.
  //
  // `lang` is a dependency because switching zh→en rewrites every label, which
  // moves the whole row even though `active` has not changed — that case was
  // measured 123px out of place without it.
  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const measure = () => {
      const index = NAV_SECTIONS.findIndex(([id]) => id === active)
      const link = list.querySelectorAll('a')[index < 0 ? 0 : index]
      if (!link) return
      const listRect = list.getBoundingClientRect()
      const linkRect = link.getBoundingClientRect()
      // Slightly narrower than the label so the glow reads as an accent, not a
      // second button.
      const w = Math.max(18, linkRect.width * 0.66)
      setGlider({ x: linkRect.left - listRect.left + (linkRect.width - w) / 2, w })
    }

    measure()

    // Any width change moves the target, whether or not `active` changed:
    // font loading, language switch, a narrower window, the tools row growing.
    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(list)
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure).catch(() => {})

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [active, lang])

  return (
    <>
      <div className="progress-bar" aria-hidden="true" style={{ width: `${progress * 100}%` }} />
      <nav className="topnav" aria-label={t('nav.label')}>
        <span className="topnav__brand mono" onClick={onEnter} role="button" tabIndex={0}>
          MolCosmos
        </span>
        <ul ref={listRef}>
          {glider && (
            <span
              className="topnav__glider"
              aria-hidden="true"
              style={{ transform: `translateX(${glider.x}px)`, width: `${glider.w}px` }}
            />
          )}
          {NAV_SECTIONS.map(([id, key]) => (
            <li key={id} className={active === id ? 'topnav__item--active' : ''}>
              <a href={`#${id}`}>{t(key)}</a>
            </li>
          ))}
        </ul>
        <TopnavTools themeId={themeId} onTheme={onTheme} />
      </nav>
    </>
  )
}
