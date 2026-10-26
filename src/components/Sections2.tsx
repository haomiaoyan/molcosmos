import { useEffect, useState } from 'react'
import { CITATIONS } from '../config'

export function MethodSection() {
  return (
    <section className="section" id="method" aria-labelledby="method-title">
      <header className="section__head">
        <p className="section__eyebrow mono">方法说明</p>
        <h2 id="method-title" className="section__title">
          这片宇宙是<span className="accent-text">怎么算出来的</span>
        </h2>
        <p className="section__lead">
          页面上每一个数字都可以复核。这里列出全部计算口径——课程演示用，不是任何真实药物研发的复现。
        </p>
      </header>
      <div className="method-grid">
        <article className="method-card">
          <h3>分子从哪来</h3>
          <p>
            600 个分子全部由固定种子的伪随机数生成器（LCG）确定性生成。同一种子永远得到同一片宇宙——
            这既是为了测试可复现，也是为了让每个访客看到同一片星空。
          </p>
        </article>
        <article className="method-card">
          <h3>性质怎么算</h3>
          <p>
            分子量 = 重原子数 × 原子量 + 氢；logP 用「碳增油、杂原子减油」的线性近似；氢键供受体由 N/O/S 计数导出。
            全部是教学级近似，不是力场或量子化学。
          </p>
        </article>
        <article className="method-card">
          <h3>「类药潜力」是什么</h3>
          <p>
            五个高斯项的加权和：分子量 ≈ 350、logP ≈ 2.5、HBD ≈ 2、HBA ≈ 5、环数 ≈ 3 的分子得 1 分，
            离得越远衰减越快。它衡量的是「离理想区多近」，不是「有没有药效」。
          </p>
        </article>
        <article className="method-card">
          <h3>3D 结构是什么</h3>
          <p>
            球棍模型由「随机生成树 + 环闭合 + 24 轮弹簧松弛」的示意布局算法产生，视觉上像有机分子，
            但不是任何真实构象搜索的结果。
          </p>
        </article>
      </div>
      <ul className="citation-list">
        <li>{CITATIONS.chemicalSpace}</li>
        <li>{CITATIONS.lipinski}</li>
        <li>{CITATIONS.funnel}</li>
      </ul>
    </section>
  )
}

export function LimitsSection() {
  return (
    <section className="section section--limits" id="limits" aria-labelledby="limits-title">
      <header className="section__head">
        <p className="section__eyebrow mono">边界声明</p>
        <h2 id="limits-title" className="section__title">
          这个工具<span className="accent-text">不能</span>告诉你什么
        </h2>
      </header>
      <ul className="limits-list">
        <li>
          <strong>合成数据。</strong>所有分子、性质、结构均为教学近似，不对应任何真实化合物或实验测量。
        </li>
        <li>
          <strong>非临床证据。</strong>「类药潜力」不预测药效、毒性或任何临床结局；Lipinski 规则也只是经验启发式，例外比比皆是。
        </li>
        <li>
          <strong>布局是隐喻。</strong>星系位置由索引决定而非分子性质——化学空间的真实「距离」要用分子指纹或结构相似度衡量，这里没有做。
        </li>
        <li>
          <strong>生成式探索是动画。</strong>「触发探索」展示的是生成式模型采样行为的示意，没有真实模型在本页运行。
        </li>
      </ul>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <p>
        MolCosmos · 分子宇宙 —— 医学人工智能导论课程项目。纯前端、无追踪、无真实医药数据。
      </p>
      <p className="muted">
        参考文献：Boháček et al. 1996（10⁶⁰ 估计）；Lipinski et al. 1997（Rule of Five）；
        PhRMA 药物研发漏斗示意口径。
      </p>
    </footer>
  )
}

/** Small scroll-progress bar + nav, pure decoration for the "冗余 UI" requirement. */
export function Chrome({ onEnter }: { onEnter: () => void }) {
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
    ['top', '首页'],
    ['pipeline', '流水线'],
    ['funnel', '漏斗'],
    ['stats', '普查'],
    ['method', '方法'],
    ['limits', '边界'],
  ] as const

  return (
    <>
      <div className="progress-bar" aria-hidden="true" style={{ width: `${progress * 100}%` }} />
      <nav className="topnav" aria-label="页面导航">
        <span className="topnav__brand mono" onClick={onEnter} role="button" tabIndex={0}>
          MolCosmos
        </span>
        <ul>
          {links.map(([id, label]) => (
            <li key={id} className={active === id ? 'topnav__item--active' : ''}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
