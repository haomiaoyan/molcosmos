import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CosmosScene } from './components/CosmosScene'
import { Hero } from './components/Hero'
import { MoleculePanel, UniverseLegend } from './components/MoleculePanel'
import { CosmosControls } from './components/CosmosControls'
import { Shortlist } from './components/Shortlist'
import { CosmosStats, FunnelSection, PipelineSection } from './components/Sections'
import { Footer, LimitsSection, MethodSection } from './components/Sections2'
import { Chrome } from './components/Sections2'
import { findMoleculeById, spawnExplorationBatch, universe, type ExplorationStar, type MoleculeClass } from './lib/galaxy'
import type { Molecule } from './lib/molecule'
import { shareUrl, loadShortlist, resolveShortlist, saveShortlist, toggleShortlist } from './lib/shortlist'
import { stepUniverse } from './lib/search'

export default function App() {
  const [selected, setSelected] = useState<Molecule | null>(null)
  const [focus, setFocus] = useState<{ x: number; y: number; z: number } | null>(null)
  const [explorationStars, setExplorationStars] = useState<ExplorationStar[]>([])
  const [exploreRound, setExploreRound] = useState(0)
  const [entered, setEntered] = useState(false)
  const [activeClass, setActiveClass] = useState<MoleculeClass | null>(null)
  const [saved, setSaved] = useState<string[]>(() => loadShortlist())
  const [toast, setToast] = useState<string | null>(null)
  const cosmosRef = useRef<HTMLElement | null>(null)

  const catalogue = useMemo(() => universe(), [])
  const shortlist = useMemo(
    () => resolveShortlist(saved, (id) => findMoleculeById(id)),
    [saved],
  )

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

  useEffect(() => {
    saveShortlist(saved)
  }, [saved])

  // Keep the address bar in step with the open molecule, so copying the URL
  // from the browser shares the same deep link the 分享 button produces.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (selected) url.searchParams.set('star', selected.id)
    else url.searchParams.delete('star')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [selected])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(id)
  }, [toast])

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

  /** Bring the visitor to a molecule wherever it came from (search, dice, keys). */
  const revealMolecule = useCallback((m: Molecule) => {
    setSelected(m)
    setFocus({ x: m.x, y: m.y, z: m.z })
    setEntered(true)
  }, [])

  const randomMolecule = useCallback(() => {
    const pool = explorationStars.length > 0 ? [...catalogue, ...explorationStars] : catalogue
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (pick) revealMolecule(pick)
  }, [catalogue, explorationStars, revealMolecule])

  // ← / → walk the catalogue so the galaxy is browsable without aiming.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      const el = event.target as HTMLElement | null
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      event.preventDefault()
      const next = stepUniverse(catalogue, selected, event.key === 'ArrowRight' ? 1 : -1)
      revealMolecule(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [catalogue, selected, revealMolecule])

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => toggleShortlist(prev, id))
  }, [])

  const copyShareLink = useCallback(async (molecule: Molecule) => {
    const url = shareUrl(molecule.id, window.location.href)
    try {
      await navigator.clipboard.writeText(url)
      setToast(`已复制 ${molecule.id} 的链接`)
    } catch {
      setToast(url)
    }
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const savedSelected = Boolean(selected && saved.includes(selected.id))

  return (
    <div className="app">
      <Chrome onEnter={scrollToTop} />
      <Hero onStart={enterCosmos} onExplore={triggerExploration} />
      <section className="cosmos" id="cosmos" ref={cosmosRef as React.RefObject<HTMLElement>}>
        <div className="cosmos__head">
          <p className="section__eyebrow mono">主展览</p>
          <h2 className="section__title">分子宇宙</h2>
          <p className="cosmos__hint muted">
            点击任意星辰查看分子 · ← → 键逐个漫游 · 双击空白返回全景 · 紫色新星是「生成式探索」刚采样的候选
          </p>
        </div>
        <div className={`cosmos__stage ${entered ? '' : 'cosmos__stage--dim'}`}>
          <CosmosScene
            onPick={handlePick}
            explorationStars={explorationStars}
            focus={focus}
            selected={selected}
            activeClass={activeClass}
          />
          <CosmosControls
            generated={explorationStars}
            onSelect={revealMolecule}
            onRandom={randomMolecule}
          />
          <UniverseLegend
            activeClass={activeClass}
            onSelectClass={(cls) => setActiveClass((cur: MoleculeClass | null) => (cur === cls ? null : cls))}
          />
          <Shortlist
            molecules={shortlist}
            onSelect={revealMolecule}
            onRemove={toggleSave}
            onClear={() => setSaved([])}
          />
          <MoleculePanel
            molecule={selected}
            onClose={() => setSelected(null)}
            saved={savedSelected}
            onToggleSave={toggleSave}
            onShare={copyShareLink}
          />
          <button type="button" className="explore-btn" onClick={triggerExploration}>
            <span className="explore-btn__pulse" aria-hidden="true" />
            触发生成式探索
          </button>
          {toast && <div className="toast mono">{toast}</div>}
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
