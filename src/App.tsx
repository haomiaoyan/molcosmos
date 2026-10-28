import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CosmosScene } from './components/CosmosScene'
import { Hero } from './components/Hero'
import { MoleculePanel, UniverseLegend } from './components/MoleculePanel'
import { CosmosControls } from './components/CosmosControls'
import { Shortlist } from './components/Shortlist'
import { LabSection } from './components/LabSection'
import { CompareSection } from './components/CompareSection'
import { TimelineSection } from './components/TimelineSection'
import { CosmosStats, FunnelSection, PipelineSection } from './components/Sections'
import { Footer, LimitsSection, MethodSection } from './components/Sections2'
import { Chrome } from './components/Sections2'
import {
  findMoleculeById,
  rescoreMolecules,
  rescoreUniverse,
  spawnExplorationBatch,
  type ExplorationStar,
  type MoleculeClass,
} from './lib/galaxy'
import { I18nProvider, useI18n } from './lib/i18n'
import { applyTheme, loadTheme, saveTheme, themeById, type ThemeId } from './lib/theme'
import type { Molecule } from './lib/molecule'
import { shareUrl, loadShortlist, resolveShortlist, saveShortlist, toggleShortlist } from './lib/shortlist'
import { stepUniverse } from './lib/search'
import { EMPTY_URL_STATE, readUrlState, writeUrlState, type UrlState } from './lib/urlState'
import { DEFAULT_WEIGHTS, isDefaultWeights, type Weights } from './lib/weights'

function CosmosApp({ initialUrl }: { initialUrl: UrlState }) {
  const { t, lang } = useI18n()
  const [selected, setSelected] = useState<Molecule | null>(null)
  const [focus, setFocus] = useState<{ x: number; y: number; z: number } | null>(null)
  const [explorationStars, setExplorationStars] = useState<ExplorationStar[]>([])
  const [exploreRound, setExploreRound] = useState(0)
  const [entered, setEntered] = useState(false)
  const [activeClass, setActiveClass] = useState<MoleculeClass | null>(null)
  const [saved, setSaved] = useState<string[]>(() => loadShortlist())
  const [themeId, setThemeId] = useState<ThemeId>(() => initialUrl.theme ?? loadTheme())
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [toast, setToast] = useState<string | null>(null)
  const cosmosRef = useRef<HTMLElement | null>(null)

  // The catalogue re-scores under the sandbox weights; positions never move.
  const catalogue = useMemo(() => rescoreUniverse(weights), [weights])
  const scoredExploration = useMemo(
    () => rescoreMolecules(explorationStars, weights),
    [explorationStars, weights],
  )
  const shortlist = useMemo(
    () => resolveShortlist(saved, (id) => findMoleculeById(id)),
    [saved],
  )
  const sceneBg = themeById(themeId).sceneBg

  // Paint the palette before first contentful paint of the themed surfaces.
  useEffect(() => {
    applyTheme(themeId)
    saveTheme(themeId)
  }, [themeId])

  // Deep link support: ?star=MCX-000123 flies to a molecule on first paint.
  useEffect(() => {
    if (!initialUrl.star) return
    const m = findMoleculeById(initialUrl.star)
    if (m) {
      setSelected(m)
      setFocus({ x: m.x, y: m.y, z: m.z })
      setEntered(true)
    }
  }, [initialUrl.star])

  useEffect(() => {
    saveShortlist(saved)
  }, [saved])

  // Keep the address bar in step with the view, so copying the URL from the
  // browser shares the same molecule, palette and language the visitor sees.
  useEffect(() => {
    const search = writeUrlState(window.location.search, {
      star: selected?.id ?? null,
      theme: themeId,
      lang,
    })
    window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`)
  }, [selected, themeId, lang])

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

  const copyShareLink = useCallback(
    async (molecule: Molecule) => {
      const url = shareUrl(molecule.id, window.location.href)
      try {
        await navigator.clipboard.writeText(url)
        setToast(t('toast.copied', { id: molecule.id }))
      } catch {
        setToast(url)
      }
    },
    [t],
  )

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const savedSelected = Boolean(selected && saved.includes(selected.id))

  return (
    <div className="app">
      <Chrome onEnter={scrollToTop} themeId={themeId} onTheme={setThemeId} />
      <Hero onStart={enterCosmos} onExplore={triggerExploration} />
      <section className="cosmos" id="cosmos" ref={cosmosRef as React.RefObject<HTMLElement>}>
        <div className="cosmos__head">
          <p className="section__eyebrow mono">{t('cosmos.eyebrow')}</p>
          <h2 className="section__title">{t('cosmos.title')}</h2>
          <p className="cosmos__hint muted">{t('cosmos.hint')}</p>
        </div>
        <div className={`cosmos__stage ${entered ? '' : 'cosmos__stage--dim'}`}>
          <CosmosScene
            molecules={catalogue}
            onPick={handlePick}
            explorationStars={scoredExploration}
            focus={focus}
            selected={selected}
            activeClass={activeClass}
            sceneBg={sceneBg}
          />
          <CosmosControls
            generated={scoredExploration}
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
            customWeights={!isDefaultWeights(weights)}
          />
          <button type="button" className="explore-btn" onClick={triggerExploration}>
            <span className="explore-btn__pulse" aria-hidden="true" />
            {t('cosmos.explore')}
          </button>
          {toast && <div className="toast mono">{toast}</div>}
        </div>
      </section>
      <PipelineSection />
      <FunnelSection />
      <CosmosStats />
      <CompareSection molecules={shortlist} />
      <LabSection weights={weights} onChange={setWeights} />
      <TimelineSection />
      <MethodSection />
      <LimitsSection />
      <Footer />
    </div>
  )
}

export default function App() {
  // Read the link once, before anything renders: both the provider and the
  // cosmos need it, and re-reading on every render would fight the sync effect.
  const [initialUrl] = useState(() =>
    typeof window === 'undefined' ? EMPTY_URL_STATE : readUrlState(window.location.search),
  )
  return (
    <I18nProvider initialLang={initialUrl.lang ?? undefined}>
      <CosmosApp initialUrl={initialUrl} />
    </I18nProvider>
  )
}
