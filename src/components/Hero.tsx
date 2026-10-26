import { APP_NAME } from '../config'

interface Props {
  onStart: () => void
  onExplore: () => void
}

const FEATURES = [
  {
    title: '一片星系，一次讲清',
    body: '约 10⁶⁰ 个类药分子构成的化学空间，画成一片三臂旋涡星系。每颗星都由固定种子确定性生成。',
  },
  {
    title: '亮度即类药潜力',
    body: 'AI 打分高的星更亮更大：分子量、logP、氢键、环系离口服药理想区越近，星光越盛。',
  },
  {
    title: '点开任何一颗星',
    body: '3D 球棍模型、性质雷达图、Lipinski 徽章——每个数字都来自你眼前这份代码，可以手算复核。',
  },
]

export function Hero({ onStart, onExplore }: Props) {
  return (
    <section className="hero" id="top">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__stars" aria-hidden="true" />
      <div className="hero__inner">
        <p className="hero__eyebrow">
          <span className="dot" aria-hidden="true" /> {APP_NAME} · 医学人工智能导论项目 · 纯前端 · 无真实数据
        </p>
        <h1 className="hero__title">
          一粒药里的 AI：
          <br />
          从 <span className="hero__accent">10⁶⁰</span> 个可能分子，
          <br />
          到<span className="hero__accent">一片获批的药</span>。
        </h1>
        <p className="hero__lead">
          药物设计要搜索的化学空间大得没有物理意义。这个页面把其中 600 个合成分子排成一片星系，
          让你亲眼看到 AI 生成式模型「只探索宜居带」的直觉从何而来。
        </p>
        <div className="hero__actions">
          <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
            进入分子宇宙
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="btn btn--ghost btn--lg" onClick={onExplore}>
            触发一次生成式探索
          </button>
        </div>
        <ul className="feature-grid">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="feature">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
