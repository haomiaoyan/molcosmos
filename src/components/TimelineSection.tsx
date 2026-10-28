import { useI18n, type StringKey } from '../lib/i18n'

interface Node {
  readonly key: string
  readonly year: StringKey
  readonly title: StringKey
  readonly body: StringKey
  /** Marks the two foundational results the rest of the field rests on. */
  readonly foundation?: boolean
}

const NODES: readonly Node[] = [
  { key: '1996', year: 'timeline.1996.year', title: 'timeline.1996.title', body: 'timeline.1996.body', foundation: true },
  { key: '1997', year: 'timeline.1997.year', title: 'timeline.1997.title', body: 'timeline.1997.body', foundation: true },
  { key: '2020a', year: 'timeline.2020a.year', title: 'timeline.2020a.title', body: 'timeline.2020a.body' },
  { key: '2020b', year: 'timeline.2020b.year', title: 'timeline.2020b.title', body: 'timeline.2020b.body' },
  { key: '2025', year: 'timeline.2025.year', title: 'timeline.2025.title', body: 'timeline.2025.body' },
] as const

/**
 * Five dated milestones, each traceable to a paper or a company announcement.
 *
 * The section exists because the rest of the page shows *how* the pipeline
 * works; a visitor still needs to know the field is thirty years old and most
 * of its headline claims carry caveats. Every node keeps them inline rather
 * than in a footnote nobody reads.
 */
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

      <ol className="timeline">
        {NODES.map((node, index) => (
          <li
            key={node.key}
            className={`timeline__item${node.foundation ? ' timeline__item--foundation' : ''}`}
            style={{ ['--i' as string]: index }}
          >
            <div className="timeline__rail" aria-hidden="true">
              <span className="timeline__dot" />
            </div>
            <div className="timeline__card">
              <p className="timeline__year mono">{t(node.year)}</p>
              <h3 className="timeline__title">{t(node.title)}</h3>
              <p className="timeline__body">{t(node.body)}</p>
            </div>
          </li>
        ))}
      </ol>

      <aside className="timeline__disclaimer">
        <p className="timeline__disclaimer-title">{t('timeline.disclaimer.title')}</p>
        <p className="timeline__disclaimer-body">{t('timeline.disclaimer.body')}</p>
      </aside>
    </section>
  )
}
