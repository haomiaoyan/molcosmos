import { useI18n } from '../lib/i18n'
import { pointerVars, usePointerField } from '../lib/pointer'
import { HeroMolecule } from './HeroMolecule'
import { HeroStage } from './HeroStage'

interface Props {
  onStart: () => void
  onExplore: () => void
}

export function Hero({ onStart, onExplore }: Props) {
  const { t } = useI18n()
  // The backdrop leans towards the pointer; the title picks up a highlight
  // that follows it. Neither moves the text itself — see lib/pointer.ts.
  const { ref, field } = usePointerField<HTMLElement>()

  return (
    <section className="hero" id="top" ref={ref} style={pointerVars(field)}>
      <HeroStage />
      <div className="hero__inner">
        <div className="hero__molecule-slot">
          <HeroMolecule />
        </div>
        <h1 className="hero__title">
          <span className="hero-line">{t('hero.title.l1')}</span>
          <span className="hero-line">
            {t('hero.title.l2pre')}
            <span className="hero__accent" data-no-split>10⁶⁰</span>
            {t('hero.title.l2post')}
          </span>
          <span className="hero-line">
            {t('hero.title.l3pre')}
            <span className="hero__accent" data-no-split>{t('hero.title.l3accent')}</span>
            {t('hero.title.l3post')}
          </span>
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
      </div>
    </section>
  )
}
