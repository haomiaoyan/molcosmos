import { useRef } from 'react'
import { useI18n } from '../lib/i18n'
import { pointerVars, usePointerField } from '../lib/pointer'
import { resolveColor } from './rb/themeColor'
import { ClickSpark, FadeContent, Magnet, StarBorder } from './rb'
import { HeroMolecule } from './HeroMolecule'
import { HeroStage } from './HeroStage'

interface Props {
  onStart: () => void
  onExplore: () => void
}

/**
 * Hero. The pointer-driven backdrop and the title's drop-shadow light are the
 * original design; the React Bits layer only adds entrance/reveal and button
 * feedback on top of it.
 *
 * B1 rules:
 * - the heading stays an <h1> (FadeContent renders via `as`);
 * - it is fail-visible: FadeContent never sets visibility:hidden, so a JS
 *   error cannot blank the headline;
 * - every animation is opt-out under prefers-reduced-motion (handled inside
 *   the components);
 * - no new copy: all strings still come from the i18n table.
 */
export function Hero({ onStart, onExplore }: Props) {
  const { t } = useI18n()
  // The backdrop leans towards the pointer; the title picks up a highlight
  // that follows it. Neither moves the text itself — see lib/pointer.ts.
  //
  // The stage is handed over as a second, wider frame for the cursor light:
  // `.hero` is capped at 1180px by `.app`, so measuring the light against it
  // made the pointer die 130px short of each edge at 1440 (measured
  // `--m-on: 0` at clientX 100 and 1420).
  const stageRef = useRef<HTMLDivElement | null>(null)
  const { ref, field } = usePointerField<HTMLElement>(stageRef)

  // Canvas effects need concrete colours; resolved at render so a theme
  // switch repaints the light in the new accent.
  const accent = resolveColor('--accent', '#ffd47e')

  return (
    <section className="hero" id="top" ref={ref} style={pointerVars(field)}>
      <HeroStage stageRef={stageRef} />
      <div className="hero__inner">
        <div className="hero__molecule-slot">
          <HeroMolecule />
        </div>
        <FadeContent
          as="h1"
          className="hero__title"
          trigger="mount"
          duration={0.9}
          stagger={0.14}
          ease="power2.out"
        >
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
        </FadeContent>
        <FadeContent as="p" className="hero__lead" trigger="mount" duration={0.8} delay={0.35}>
          {t('hero.lead')}
        </FadeContent>
        <FadeContent className="hero__actions" trigger="mount" duration={0.8} delay={0.55}>
          <ClickSpark
            sparkColor={accent}
            sparkSize={12}
            sparkRadius={26}
            sparkCount={7}
            duration={520}
            layer="front"
          >
            <Magnet magnetStrength={1.6} padding={40} maxOffset={10}>
              <StarBorder
                className="btn btn--primary btn--lg hero__cta"
                radius={999}
                thickness={2}
                color={accent}
                trailColor={accent}
                backgroundColor="linear-gradient(120deg, rgb(var(--accent-rgb) / 0.9), rgb(var(--accent-3-rgb) / 0.85))"
                textColor="var(--on-accent)"
                borderColor="transparent"
                onClick={onStart}
              >
                {t('hero.cta')}
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </StarBorder>
            </Magnet>
            <Magnet magnetStrength={1.4} padding={40} maxOffset={8}>
              <button type="button" className="btn btn--ghost btn--lg" onClick={onExplore}>
                {t('hero.cta2')}
              </button>
            </Magnet>
          </ClickSpark>
        </FadeContent>
      </div>
    </section>
  )
}
