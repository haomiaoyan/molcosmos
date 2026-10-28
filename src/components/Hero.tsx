import { APP_NAME } from '../config'
import { useI18n } from '../lib/i18n'
import { HeroMolecule } from './HeroMolecule'

interface Props {
  onStart: () => void
  onExplore: () => void
}

const FEATURES = [
  ['hero.f1.title', 'hero.f1.body'],
  ['hero.f2.title', 'hero.f2.body'],
  ['hero.f3.title', 'hero.f3.body'],
  ['hero.f4.title', 'hero.f4.body'],
] as const

export function Hero({ onStart, onExplore }: Props) {
  const { t } = useI18n()
  return (
    <section className="hero" id="top">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__stars" aria-hidden="true" />
      <div className="hero__inner">
        <div className="hero__molecule-slot">
          <HeroMolecule />
        </div>
        <p className="hero__eyebrow">
          <span className="dot" aria-hidden="true" /> {APP_NAME} · {t('app.course')} · {t('hero.eyebrow')}
        </p>
        <h1 className="hero__title">
          {t('hero.title.l1')}
          <br />
          {t('hero.title.l2pre')}
          <span className="hero__accent">10⁶⁰</span>
          {t('hero.title.l2post')}
          <br />
          {t('hero.title.l3pre')}
          <span className="hero__accent">{t('hero.title.l3accent')}</span>
          {t('hero.title.l3post')}
        </h1>
        <p className="hero__lead">{t('hero.lead')}</p>
        <div className="hero__actions">
          <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
            {t('hero.cta')}
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="btn btn--ghost btn--lg" onClick={onExplore}>
            {t('hero.cta2')}
          </button>
        </div>
        <ul className="feature-grid">
          {FEATURES.map(([title, body]) => (
            <li key={title} className="feature">
              <h3>{t(title)}</h3>
              <p>{t(body)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
