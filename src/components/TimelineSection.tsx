import { useI18n } from '../lib/i18n'
import { TimelineAxis, type AxisNode } from './TimelineAxis'

/**
 * Five dated milestones, each traceable to a paper or a company announcement.
 *
 * The section exists because the rest of the page shows *how* the pipeline
 * works; a visitor still needs to know the field is thirty years old and most
 * of its headline claims carry caveats. Every node keeps them inline rather
 * than in a footnote nobody reads.
 *
 * The drawing moved to `TimelineAxis` when the five per-node rails became one
 * line: the copy is the only thing this component should own.
 */
const NODES: readonly AxisNode[] = [
  { key: '1996', year: 'timeline.1996.year', title: 'timeline.1996.title', body: 'timeline.1996.body', foundation: true },
  { key: '1997', year: 'timeline.1997.year', title: 'timeline.1997.title', body: 'timeline.1997.body', foundation: true },
  { key: '2020a', year: 'timeline.2020a.year', title: 'timeline.2020a.title', body: 'timeline.2020a.body' },
  { key: '2020b', year: 'timeline.2020b.year', title: 'timeline.2020b.title', body: 'timeline.2020b.body' },
  { key: '2025', year: 'timeline.2025.year', title: 'timeline.2025.title', body: 'timeline.2025.body' },
] as const

export function TimelineSection() {
  const { t } = useI18n()

  return (
    <section className="section" id="timeline" aria-labelledby="timeline-title">
      <header className="section__head">
        <p className="section__eyebrow mono">{t('timeline.eyebrow')}</p>
        <h2 id="timeline-title" className="section__title">
          {t('timeline.title.pre')}
          <span className="accent-text">{t('timeline.title.accent')}</span>
        </h2>
        <p className="section__lead">{t('timeline.lead')}</p>
      </header>

      <TimelineAxis nodes={NODES} />

      <aside className="timeline__disclaimer">
        <p className="timeline__disclaimer-title">{t('timeline.disclaimer.title')}</p>
        <p className="timeline__disclaimer-body">{t('timeline.disclaimer.body')}</p>
      </aside>
    </section>
  )
}
