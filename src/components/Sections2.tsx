import { useEffect, useState } from 'react'
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

/** Small scroll-progress bar + nav, pure decoration for the "冗余 UI" requirement. */
export function Chrome({ onEnter, themeId, onTheme }: { onEnter: () => void; themeId: ThemeId; onTheme: (id: ThemeId) => void }) {
  const { t } = useI18n()
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState('top')

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0)
      const sections = ['top', 'pipeline', 'funnel', 'stats', 'method', 'limits']
      let current = 'top'
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) current = id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    ['top', 'nav.home'],
    ['pipeline', 'nav.pipeline'],
    ['funnel', 'nav.funnel'],
    ['stats', 'nav.stats'],
    ['lab', 'nav.lab'],
    ['method', 'nav.method'],
    ['limits', 'nav.limits'],
  ] as const

  return (
    <>
      <div className="progress-bar" aria-hidden="true" style={{ width: `${progress * 100}%` }} />
      <nav className="topnav" aria-label={t('nav.label')}>
        <span className="topnav__brand mono" onClick={onEnter} role="button" tabIndex={0}>
          MolCosmos
        </span>
        <ul>
          {links.map(([id, key]) => (
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
