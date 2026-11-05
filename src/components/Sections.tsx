import { useMemo, type CSSProperties } from 'react'
import { useI18n } from '../lib/i18n'
import type { Molecule } from '../lib/molecule'
import { SpectrumStrip } from './SpectrumStrip'
import { StationStage, type Station } from './StationStage'

/**
 * The five stations of the AI drug-design pipeline.
 *
 * Only the accent colour and the station number live here; the copy comes from
 * i18n so the whole section switches language in place.
 */
const PIPELINE: readonly Station[] = [
  { step: '01', key: 's1', accent: '#6ea8fe' },
  { step: '02', key: 's2', accent: '#37e2c8' },
  { step: '03', key: 's3', accent: '#b389ff' },
  { step: '04', key: 's4', accent: '#ffd47e' },
  { step: '05', key: 's5', accent: '#ff6b7a' },
]

export function PipelineSection() {
  const { t } = useI18n()
  return (
    <section className="section" id="pipeline" aria-labelledby="pipeline-title">
      <header className="section__head">
        <p className="section__eyebrow mono">{t('pipeline.eyebrow')}</p>
        <h2 id="pipeline-title" className="section__title">
          {t('pipeline.title.pre')}
          <span className="accent-text">{t('pipeline.title.accent')}</span>
        </h2>
        <p className="section__lead">{t('pipeline.lead')}</p>
      </header>
      {/* The stage replaces the five-card grid; the head above stays put so the
          chapter still announces itself before it starts moving. */}
      <StationStage stations={PIPELINE} />
    </section>
  )
}

/** The classic discovery funnel, with animated counters. */
export function FunnelSection() {
  const { t } = useI18n()
  const tiers = useMemo(
    () => [
      { key: 't1', value: '5,000–10,000', width: 100, mobileWidth: 100 },
      { key: 't2', value: '~250', width: 76, mobileWidth: 90 },
      { key: 't3', value: '~5', width: 52, mobileWidth: 80 },
      { key: 't4', value: '1', width: 34, mobileWidth: 70 },
    ] as const,
    [],
  )
  return (
    <section className="section" id="funnel" aria-labelledby="funnel-title">
      <header className="section__head">
        <p className="section__eyebrow mono">{t('funnel.eyebrow')}</p>
        <h2 id="funnel-title" className="section__title">
          {t('funnel.title.pre')}
          <span className="accent-text">{t('funnel.title.accent')}</span>
        </h2>
        <p className="section__lead">{t('funnel.lead')}</p>
      </header>
      <div className="funnel">
        {tiers.map((tier, i) => (
          <div
            key={tier.key}
            className="funnel__tier"
            style={
              {
                '--tier-w': `${tier.width}%`,
                // Narrow screens cannot afford a 34%-wide final tier, so the
                // taper is softened there and the note moves to its own line.
                '--tier-w-mobile': `${tier.mobileWidth}%`,
              } as CSSProperties
            }
          >
            <div className="funnel__tier-inner">
              <span className="funnel__value mono">{tier.value}</span>
              <span className="funnel__label">{t(`funnel.${tier.key}.label` as const)}</span>
              <span className="funnel__note muted">{t(`funnel.${tier.key}.note` as const)}</span>
            </div>
            {i < tiers.length - 1 && <span className="funnel__arrow" aria-hidden="true" />}
          </div>
        ))}
        <p className="funnel__caption muted">{t('funnel.caption')}</p>
      </div>
    </section>
  )
}

/**
 * Class distribution of the generated universe.
 *
 * `molecules` is the re-scored catalogue, not the fixed 600: dragging the weight
 * sliders moves molecules between classes, and the census has to follow them.
 * That is also why nothing here reads `universe()` directly — the numbers on
 * screen would stop matching the galaxy above.
 */
export function CosmosStats({ molecules }: { molecules: readonly Molecule[] }) {
  const { t } = useI18n()
  return (
    <section className="section" id="stats" aria-labelledby="stats-title">
      <header className="section__head">
        <p className="section__eyebrow mono">{t('stats.eyebrow')}</p>
        <h2 id="stats-title" className="section__title">
          {t('stats.title.pre')}
          <span className="accent-text">{t('stats.title.accent')}</span>
        </h2>
        <p className="section__lead">{t('stats.lead')}</p>
      </header>
      <SpectrumStrip molecules={molecules} />
    </section>
  )
}
