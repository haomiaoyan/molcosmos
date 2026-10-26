import { useMemo, type CSSProperties } from 'react'
import { CLASS_COLORS, CLASS_LABELS } from '../lib/galaxy'

/** The five stations of the AI drug-design pipeline. */
const PIPELINE = [
  {
    step: '01',
    title: '靶点确认',
    body: '疾病相关的蛋白被确定为靶点。AI 在这里的作用有限——靶点是否「成药」仍取决于生物学证据。',
    aiLevel: '辅助',
    accent: '#6ea8fe',
  },
  {
    step: '02',
    title: '虚拟筛选',
    body: '在数百万个化合物库里搜索能结合靶点的分子。这是暴力枚举：化学空间有约 10⁶⁰ 个类药分子，能筛的不到一亿分之一。',
    aiLevel: '主力',
    accent: '#37e2c8',
  },
  {
    step: '03',
    title: '分子生成',
    body: '生成式模型不再等人类合成分子，而是直接「画」出新结构——在化学空间里，它只探索宜居带附近，而不是整个宇宙。',
    aiLevel: '主角登场',
    accent: '#b389ff',
  },
  {
    step: '04',
    title: '性质预测',
    body: '预测吸收、代谢、毒性（ADMET）。上方的类药打分就是这一站的极简版：分子量、logP、氢键、环系离理想区多远。',
    aiLevel: '主力',
    accent: '#ffd47e',
  },
  {
    step: '05',
    title: '合成与临床',
    body: 'AI 认为好的分子还要真的造得出来、过得临床试验。漏斗在这里最陡：数以千计的候选，最终获批的常常只有一个。',
    aiLevel: '人的战场',
    accent: '#ff6b7a',
  },
] as const

export function PipelineSection() {
  return (
    <section className="section" id="pipeline" aria-labelledby="pipeline-title">
      <header className="section__head">
        <p className="section__eyebrow mono">AI 制药流水线</p>
        <h2 id="pipeline-title" className="section__title">
          一粒药要经过的<span className="accent-text">五道关卡</span>
        </h2>
        <p className="section__lead">
          「AI 制药」不是一个岗位，而是流水线上的五份工作。每一站，AI 的参与度不同——有的站它只是助手，有的站它就是主角。
        </p>
      </header>
      <ol className="pipeline">
        {PIPELINE.map((station) => (
          <li key={station.step} className="station">
            <span
              className="station__glow"
              style={{ background: `radial-gradient(circle, ${station.accent}33, transparent 70%)` }}
              aria-hidden="true"
            />
            <div className="station__head">
              <span className="station__step mono">{station.step}</span>
              <span className="station__ai-tag" style={{ color: station.accent, borderColor: `${station.accent}55` }}>
                {station.aiLevel}
              </span>
            </div>
            <h3 className="station__title">{station.title}</h3>
            <p className="station__body">{station.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** The classic discovery funnel, with animated counters. */
export function FunnelSection() {
  const tiers = useMemo(
    () => [
      { label: '筛选化合物', value: '5,000–10,000', width: 100, mobileWidth: 100, note: '虚拟筛选 + 高通量筛选' },
      { label: '进入临床前', value: '~250', width: 76, mobileWidth: 90, note: 'ADMET 预测 + 结构优化' },
      { label: '进入临床试验', value: '~5', width: 52, mobileWidth: 80, note: 'IND 申报后的人体试验' },
      { label: '获批上市', value: '1', width: 34, mobileWidth: 70, note: '10,000 : 1 的终点' },
    ],
    [],
  )
  return (
    <section className="section" id="funnel" aria-labelledby="funnel-title">
      <header className="section__head">
        <p className="section__eyebrow mono">研发漏斗</p>
        <h2 id="funnel-title" className="section__title">
          一万个候选，<span className="accent-text">一个赢家</span>
        </h2>
        <p className="section__lead">
          从筛选到获批，每一步都在淘汰。AI 制药的全部 promise，就是把这条漏斗的每一层「收窄得慢一点」。
        </p>
      </header>
      <div className="funnel">
        {tiers.map((tier, i) => (
          <div
            key={tier.label}
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
              <span className="funnel__label">{tier.label}</span>
              <span className="funnel__note muted">{tier.note}</span>
            </div>
            {i < tiers.length - 1 && <span className="funnel__arrow" aria-hidden="true" />}
          </div>
        ))}
        <p className="funnel__caption muted">
          数字为行业常引示意口径（PhRMA 经典图表），演示用途，非任何单一项目真实数据。
        </p>
      </div>
    </section>
  )
}

/** Class distribution of the generated universe. */
export function CosmosStats() {
  const dist = useMemo(
    () =>
      (['goldilocks', 'candidate', 'lead', 'far'] as const).map((cls) => ({
        cls,
        label: CLASS_LABELS[cls],
        color: CLASS_COLORS[cls],
      })),
    [],
  )
  return (
    <section className="section" id="stats" aria-labelledby="stats-title">
      <header className="section__head">
        <p className="section__eyebrow mono">宇宙普查</p>
        <h2 id="stats-title" className="section__title">
          这片宇宙的<span className="accent-text">人口普查</span>
        </h2>
        <p className="section__lead">
          600 颗星，四类分子。宜居带分子只占极少数——这就是为什么 AI 不会「随机抽一个分子试试」，而是要学着往亮的地方走。
        </p>
      </header>
      <div className="stats-strip">
        {dist.map((entry) => (
          <ClassCard key={entry.cls} {...entry} />
        ))}
      </div>
    </section>
  )
}

function ClassCard({ cls, label, color }: { cls: string; label: string; color: string }) {
  return (
    <article className={`class-card class-card--${cls}`}>
      <span className="class-card__glow" style={{ background: color }} aria-hidden="true" />
      <h3 className="class-card__title" style={{ color }}>
        {label}
      </h3>
      <p className="class-card__body">
        {cls === 'goldilocks' && '性质贴近口服药理想区：分子量适中、logP 温和、氢键不多不少。'}
        {cls === 'candidate' && '有希望的结构：大体合规，个别性质需要优化。'}
        {cls === 'lead' && '离理想区较远，但骨架值得继续改造。'}
        {cls === 'far' && '偏远地带：太大、太油或太极端，几乎不可能成药。'}
      </p>
    </article>
  )
}
