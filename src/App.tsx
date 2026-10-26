import { useCallback, useEffect, useRef, useState } from 'react'
import { CosmosScene } from './components/CosmosScene'
import { Hero } from './components/Hero'
import { MoleculePanel, UniverseLegend } from './components/MoleculePanel'
import { CosmosStats, FunnelSection, PipelineSection } from './components/Sections'
import { Footer, LimitsSection, MethodSection } from './components/Sections2'
import { Chrome } from './components/Sections2'
import { findMoleculeById, spawnExplorationBatch, type ExplorationStar } from './lib/galaxy'
import type { Molecule } from './lib/molecule'

export default function App() {
  const [selected, setSelected] = useState<Molecule | null>(null)
  const [focus, setFocus] = useState<{ x: number; y: number; z: number } | null>(null)
  const [explorationStars, setExplorationStars] = useState<ExplorationStar[]>([])
  const [exploreRound, setExploreRound] = useState(0)
  const [entered, setEntered] = useState(false)
  const cosmosRef = useRef<HTMLElement | null>(null)

  // Deep link support: ?star=MCX-000123 flies to a molecule on first paint.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('star')
    if (!requested) return
    const m = findMoleculeById(requested)
    if (m) {
      setSelected(m)
      setFocus({ x: m.x, y: m.y, z: m.z })
      setEntered(true)
    }
  }, [])

  const handlePick = useCallback((m: Molecule) => {
    setSelected(m)
    setFocus({ x: m.x, y: m.y, z: m.z })
  }, [])

  const enterCosmos = useCallback(() => {
    setEntered(true)
    requestAnimationFrame(() => {
      cosmosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const triggerExploration = useCallback(() => {
    setExploreRound((round) => round + 1)
  }, [])

  // Each exploration round spawns a fresh batch of ephemeral stars, then
  // keeps a rolling window of the last two batches for the trail effect.
  useEffect(() => {
    if (exploreRound === 0) return
    const batch = spawnExplorationBatch(exploreRound)
    setExplorationStars((prev) => [...prev.slice(-26), ...batch])
  }, [exploreRound])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="app">
      <Chrome onEnter={scrollToTop} />
      <Hero onStart={enterCosmos} onExplore={triggerExploration} />
      <section className="cosmos" id="cosmos" ref={cosmosRef as React.RefObject<HTMLElement>}>
        <div className="cosmos__head">
          <p className="section__eyebrow mono">主展览</p>
          <h2 className="section__title">分子宇宙</h2>
          <p className="cosmos__hint muted">
            点击任意星辰查看分子 · 双击空白返回全景 · 紫色新星是「生成式探索」刚采样的候选，同样可以点开
          </p>
        </div>
        <div className={`cosmos__stage ${entered ? '' : 'cosmos__stage--dim'}`}>
          <CosmosScene
            onPick={handlePick}
            explorationStars={explorationStars}
            focus={focus}
            selected={selected}
          />
          <UniverseLegend />
          <MoleculePanel molecule={selected} onClose={() => setSelected(null)} />
          <button type="button" className="explore-btn" onClick={triggerExploration}>
            <span className="explore-btn__pulse" aria-hidden="true" />
            触发生成式探索
          </button>
        </div>
      </section>
      <PipelineSection />
      <FunnelSection />
      <CosmosStats />
      <MethodSection />
      <LimitsSection />
      <Footer />
    </div>
  )
}
